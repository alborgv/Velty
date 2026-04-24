from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from ..models import Installment, Loans
from ..serializers import InstallmentSerializer


class InstallmentViewSet(viewsets.ModelViewSet):
    serializer_class = InstallmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Installment.objects.filter(loan__user=self.request.user)
        loan_id = self.request.query_params.get('loan')
        if loan_id:
            qs = qs.filter(loan_id=loan_id)
        return qs.order_by('due_date')

    def perform_destroy(self, instance):
        from decimal import Decimal
        import datetime
        from django.db.models import Sum
        
        loan = instance.loan
        instance.delete()
        
        paid_installments = loan.installments.filter(status=Installment.Status.PAID)
        num_paid = paid_installments.count()
        total_paid_capital = paid_installments.aggregate(total=Sum('capital'))['total'] or Decimal('0.00')
        total_paid_interest = paid_installments.aggregate(total=Sum('interest'))['total'] or Decimal('0.00')
        total_paid_amount = paid_installments.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        amount_decimal = loan.amount
        monthly_interest = (amount_decimal * loan.interest_rate) / Decimal('100.0')
        total_interest = monthly_interest * loan.term_months
        total_owed = amount_decimal + total_interest
        
        remaining_owed = total_owed - total_paid_amount
        remaining_capital = amount_decimal - total_paid_capital
        remaining_interest = total_interest - total_paid_interest
        
        if loan.payment_frequency == Loans.PaymentFrequency.MONTHLY:
            total_installments = loan.term_months
        else:
            total_installments = loan.term_months * 2
            
        remaining_installments = total_installments - num_paid
        
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
            
        today = timezone.now().date()
        has_overdue = loan.installments.filter(
            status=Installment.Status.PENDING,
            due_date__lt=today
        ).exists()
        
        if remaining_installments <= 0:
            loan.status = Loans.Status.PAID
        elif has_overdue:
            loan.status = Loans.Status.OVERDUE
        else:
            loan.status = Loans.Status.ACTIVE
        loan.save()

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        installment = self.get_object()

        if installment.status == Installment.Status.PAID:
            return Response(
                {'error': 'Esta cuota ya está pagada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        today = timezone.now().date()
        installment.status = Installment.Status.PAID
        installment.paid_at = today
        installment.save()

        loan = installment.loan

        # Check if all installments are now paid
        all_paid = not loan.installments.filter(
            status__in=[Installment.Status.PENDING, Installment.Status.OVERDUE]
        ).exists()

        if all_paid:
            from decimal import Decimal
            from django.db.models import Sum
            total_paid = loan.installments.filter(
                status=Installment.Status.PAID
            ).aggregate(total=Sum('capital'))['total'] or Decimal('0.00')

            interest_amount = (loan.amount * loan.interest_rate) / Decimal('100.0')
            total_owed = loan.amount + interest_amount

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
        else:
            # Check if any pending installments are overdue
            has_overdue = loan.installments.filter(
                status=Installment.Status.PENDING,
                due_date__lt=today
            ).exists()
            if has_overdue:
                loan.status = Loans.Status.OVERDUE
            else:
                loan.status = Loans.Status.ACTIVE
            loan.save()

        return Response({'status': 'payment registered', 'loan_status': loan.status})