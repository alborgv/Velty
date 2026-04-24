from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
import datetime
from decimal import Decimal

from ..models import Loans, Installment
from ..serializers import LoansSerializer


class LoanViewSet(viewsets.ModelViewSet):
    serializer_class = LoansSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['borrower__name']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']

    def get_queryset(self):
        from django.db import models
        from django.db.models import Sum, Exists, OuterRef
        from django.db.models.functions import Coalesce
        from django.utils import timezone

        today = timezone.now().date()

        # Auto-update overdue status in DB on every fetch
        overdue_loan_ids = Loans.objects.filter(
            user=self.request.user,
            status=Loans.Status.ACTIVE,
            installments__status=Installment.Status.PENDING,
            installments__due_date__lt=today,
        ).values_list('id', flat=True)

        if overdue_loan_ids:
            Loans.objects.filter(id__in=list(overdue_loan_ids)).update(status=Loans.Status.OVERDUE)

        overdue_installments = Installment.objects.filter(
            loan=OuterRef('pk'),
            status=Installment.Status.PENDING,
            due_date__lt=today
        )

        queryset = Loans.objects.filter(user=self.request.user).select_related('borrower').annotate(
            paid_amount=Coalesce(
                Sum('installments__amount', filter=models.Q(installments__status=Installment.Status.PAID)),
                Decimal('0.00')
            ),
            has_overdue=Exists(overdue_installments)
        ).all()

        filter_status = self.request.query_params.get('status')
        if filter_status:
            if filter_status == 'OVERDUE':
                queryset = queryset.filter(models.Q(status='OVERDUE') | models.Q(has_overdue=True))
            elif filter_status == 'ACTIVE':
                queryset = queryset.filter(status='ACTIVE', has_overdue=False)
            else:
                queryset = queryset.filter(status=filter_status)
        return queryset

    def perform_create(self, serializer):
        loan = serializer.save(user=self.request.user)

        from decimal import Decimal
        import datetime
        from ..models import Installment, Loans
        
        amount_decimal = loan.amount
        monthly_interest = (amount_decimal * loan.interest_rate) / Decimal('100.0')
        total_interest = monthly_interest * loan.term_months
        total_owed = amount_decimal + total_interest
        
        start_date = loan.start_date or datetime.date.today()
        
        if loan.payment_frequency == Loans.PaymentFrequency.MONTHLY:
            num_installments = loan.term_months
        else:
            num_installments = loan.term_months * 2
            
        if num_installments > 0:
            installment_amount = total_owed / num_installments
            installment_capital = amount_decimal / num_installments
            installment_interest = total_interest / num_installments
            
            installments = []
            for i in range(num_installments):
                if loan.payment_frequency == Loans.PaymentFrequency.MONTHLY:
                    month = start_date.month + (i + 1)
                    year = start_date.year + (month - 1) // 12
                    month = (month - 1) % 12 + 1
                    day = start_date.day
                    while True:
                        try:
                            due_date = datetime.date(year, month, day)
                            break
                        except ValueError:
                            day -= 1
                else:
                    due_date = start_date + datetime.timedelta(days=15 * (i+1))
                    
                installments.append(Installment(
                    loan=loan,
                    number=i+1,
                    due_date=due_date,
                    amount=installment_amount,
                    capital=installment_capital,
                    interest=installment_interest,
                    status=Installment.Status.PENDING
                ))
                
            Installment.objects.bulk_create(installments)

    def perform_update(self, serializer):
        from decimal import Decimal
        import datetime
        from django.db.models import Sum
        from rest_framework.exceptions import ValidationError
        from ..models import Installment, Loans
        
        # Guardar valores anteriores para comparar
        old_loan = self.get_object()
        old_amount = old_loan.amount
        old_interest = old_loan.interest_rate
        old_term = old_loan.term_months
        old_freq = old_loan.payment_frequency
        old_start_date = old_loan.start_date
        
        loan = serializer.save()
        
        if (old_amount != loan.amount or old_interest != loan.interest_rate or 
            old_term != loan.term_months or old_freq != loan.payment_frequency or old_start_date != loan.start_date):
            
            paid_installments = loan.installments.filter(status=Installment.Status.PAID)
            num_paid = paid_installments.count()
            total_paid_capital = paid_installments.aggregate(total=Sum('capital'))['total'] or Decimal('0.00')
            total_paid_interest = paid_installments.aggregate(total=Sum('interest'))['total'] or Decimal('0.00')
            total_paid_amount = paid_installments.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            
            amount_decimal = loan.amount
            monthly_interest = (amount_decimal * loan.interest_rate) / Decimal('100.0')
            total_interest = monthly_interest * loan.term_months
            total_owed = amount_decimal + total_interest
            
            if total_owed < total_paid_amount:
                raise ValidationError({"error": "El nuevo total adeudado es menor a lo que el cliente ya ha pagado."})
                
            remaining_owed = total_owed - total_paid_amount
            remaining_capital = amount_decimal - total_paid_capital
            remaining_interest = total_interest - total_paid_interest
            
            if loan.payment_frequency == Loans.PaymentFrequency.MONTHLY:
                total_installments = loan.term_months
            else:
                total_installments = loan.term_months * 2
                
            remaining_installments = total_installments - num_paid
            
            if remaining_installments < 0:
                 raise ValidationError({"error": "El nuevo plazo de tiempo es menor a los plazos que el cliente ya pagó."})
                 
            loan.installments.exclude(status=Installment.Status.PAID).delete()
            
            if remaining_installments > 0:
                installment_amount = remaining_owed / remaining_installments
                installment_capital = remaining_capital / remaining_installments
                installment_interest = remaining_interest / remaining_installments
                
                base_date = loan.start_date or datetime.date.today()
                
                installments = []
                for i in range(num_paid, total_installments):
                    idx = i + 1
                    if loan.payment_frequency == Loans.PaymentFrequency.MONTHLY:
                        month = base_date.month + (idx)
                        year = base_date.year + (month - 1) // 12
                        month = (month - 1) % 12 + 1
                        day = base_date.day
                        while True:
                            try:
                                due_date = datetime.date(year, month, day)
                                break
                            except ValueError:
                                day -= 1
                    else:
                        due_date = base_date + datetime.timedelta(days=15 * (idx))
                        
                    installments.append(Installment(
                        loan=loan,
                        number=idx,
                        due_date=due_date,
                        amount=installment_amount,
                        capital=installment_capital,
                        interest=installment_interest,
                        status=Installment.Status.PENDING
                    ))
                Installment.objects.bulk_create(installments)

    @extend_schema(
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "amount": {"type": "number"},
                    "paid_at": {"type": "string", "format": "date"},
                    "note": {"type": "string"}
                },
                "required": ["amount"]
            }
        },
        responses={200: {"type": "object", "properties": {"status": {"type": "string"}}}}
    )
    @action(detail=True, methods=['post'])
    def register_payment(self, request, pk=None):
        from django.utils import timezone

        loan = self.get_object()
        amount = Decimal(str(request.data.get('amount', '0')))
        paid_at_str = request.data.get('paid_at', datetime.date.today().isoformat())
        note = request.data.get('note', '')
        pay_only_interest = str(request.data.get('pay_only_interest', 'false')).lower() == 'true'
        if amount <= 0 and not pay_only_interest:
            return Response(
                {'error': 'El monto debe ser mayor a cero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            paid_at = datetime.date.fromisoformat(paid_at_str)
        except (ValueError, TypeError):
            paid_at = datetime.date.today()

        today = timezone.now().date()

        # Find the next pending installment ordered by due_date
        next_installment = loan.installments.filter(
            status=Installment.Status.PENDING
        ).order_by('due_date').first()

        if next_installment is None:
            return Response(
                {'error': 'Este préstamo no tiene cuotas pendientes.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if pay_only_interest:
            # Record that interest was paid (capital=0, does not reduce balance)
            interest_amount = next_installment.interest
            loan.installments.create(
                number=next_installment.number,
                due_date=next_installment.due_date,
                amount=interest_amount,
                capital=Decimal('0.00'),
                interest=interest_amount,
                status=Installment.Status.PAID,
                paid_at=paid_at,
                note=f"Solo intereses. {note}".strip()
            )
            
            # Replace the pending installment: keep capital only, zero interest
            old_capital = next_installment.capital
            old_due_date = next_installment.due_date
            old_number = next_installment.number
            next_installment.delete()
            
            loan.installments.create(
                number=old_number,
                due_date=old_due_date,
                amount=old_capital,
                capital=old_capital,
                interest=Decimal('0.00'),
                status=Installment.Status.PENDING,
                note="Cuota sin interés (intereses ya pagados)"
            )
        elif amount < next_installment.amount:
            ratio = amount / next_installment.amount
            paid_capital = next_installment.capital * ratio
            paid_interest = next_installment.interest * ratio
            
            # Create a new installment for the partial payment
            loan.installments.create(
                number=next_installment.number,
                due_date=next_installment.due_date,
                amount=amount,
                capital=paid_capital,
                interest=paid_interest,
                status=Installment.Status.PAID,
                paid_at=paid_at,
                note=f"Abono parcial. {note}".strip()
            )
            
            # Deduct the paid amount from the pending installment
            next_installment.amount -= amount
            next_installment.capital -= paid_capital
            next_installment.interest -= paid_interest
            next_installment.save()
            
        else:
            # Mark the installment as fully paid
            next_installment.status = Installment.Status.PAID
            next_installment.paid_at = paid_at
            next_installment.note = note
            next_installment.save()

        # Check for any overdue remaining installments and update loan status
        has_overdue = loan.installments.filter(
            status=Installment.Status.PENDING,
            due_date__lt=today
        ).exists()

        # Check if all installments are paid
        all_paid = not loan.installments.filter(
            status__in=[Installment.Status.PENDING, Installment.Status.OVERDUE]
        ).exists()

        if all_paid:
            from django.db.models import Sum as DjangoSum
            total_paid = loan.installments.filter(
                status=Installment.Status.PAID
            ).aggregate(total=DjangoSum('amount'))['total'] or Decimal('0.00')

            # Monthly interest formula: amount + (amount * rate / 100 * term_months)
            monthly_interest = (loan.amount * loan.interest_rate) / Decimal('100.0')
            total_owed = loan.amount + (monthly_interest * loan.term_months)

            loan.status = Loans.Status.PAID
            loan.save()

            if total_paid < total_owed:
                return Response({
                    'status': 'payment registered',
                    'loan_status': 'PAID',
                    'warning': (
                        f'El total pagado (${total_paid:.2f}) es menor al '
                        f'total adeudado (${total_owed:.2f}).'
                    )
                })
            return Response({'status': 'payment registered', 'loan_status': 'PAID'})
        elif has_overdue:
            loan.status = Loans.Status.OVERDUE
        else:
            loan.status = Loans.Status.ACTIVE

        loan.save()

        return Response({'status': 'payment registered'})