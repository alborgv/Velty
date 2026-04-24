from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum
from django.utils import timezone
from ..models import Loans, Installment


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        current_month = now.month
        current_year = now.year

        # Capital total en calle (suma de montos de préstamos ACTIVE)
        total_capital = Loans.objects.filter(
            user=request.user,
            status=Loans.Status.ACTIVE
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Préstamos activos
        active_loans = Loans.objects.filter(user=request.user, status=Loans.Status.ACTIVE).count()

        # Préstamos en mora
        overdue_loans = Loans.objects.filter(user=request.user, status=Loans.Status.OVERDUE).count()

        # Total cobrado este mes (cuotas pagadas en el mes actual)
        collected_month = Installment.objects.filter(
            loan__user=request.user,
            status=Installment.Status.PAID,
            paid_at__month=current_month,
            paid_at__year=current_year,
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Préstamos pagados
        paid_loans = Loans.objects.filter(user=request.user, status=Loans.Status.PAID).count()

        # Total préstamos
        total_loans = Loans.objects.filter(user=request.user).count()

        # Meta Mensual desde SystemSettings
        from ..models import SystemSettings
        try:
            settings_obj = SystemSettings.objects.filter(user=request.user).first()
            if settings_obj and settings_obj.monthly_goal > 0:
                monthly_goal = float(settings_obj.monthly_goal)
            else:
                monthly_goal = 24100000
        except Exception:
            monthly_goal = 24100000

        # Próximos cobros
        upcoming = Installment.objects.select_related('loan__borrower').filter(
            loan__user=request.user,
            status=Installment.Status.PENDING
        ).order_by('due_date')[:5]
        upcoming_collections = [{
            'id': inst.id,
            'borrower_name': inst.loan.borrower.name,
            'amount': float(inst.amount),
            'due_date': inst.due_date.isoformat() if inst.due_date else None,
        } for inst in upcoming]

        # Pagos recientes
        recent = Installment.objects.select_related('loan__borrower').filter(
            loan__user=request.user,
            status=Installment.Status.PAID
        ).order_by('-paid_at', '-id')[:5]
        recent_payments = [{
            'id': inst.id,
            'borrower_name': inst.loan.borrower.name,
            'amount': float(inst.amount),
            'paid_at': inst.paid_at.isoformat() if inst.paid_at else None,
        } for inst in recent]

        return Response({
            'total_capital': float(total_capital),
            'active_loans': active_loans,
            'overdue_loans': overdue_loans,
            'paid_loans': paid_loans,
            'collected_month': float(collected_month),
            'monthly_goal': monthly_goal,
            'total_loans': total_loans,
            'upcoming_collections': upcoming_collections,
            'recent_payments': recent_payments,
        })


class MonthlyReportView(APIView):
    """Full monthly report: all payments in the current month, grouped by day,
    plus goal progress and all active/overdue loans summary."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum, Count
        now = timezone.now()
        current_month = now.month
        current_year = now.year

        # All installments paid this month
        paid_installments = Installment.objects.select_related('loan__borrower').filter(
            loan__user=request.user,
            status=Installment.Status.PAID,
            paid_at__month=current_month,
            paid_at__year=current_year,
        ).order_by('paid_at')

        total_collected = paid_installments.aggregate(t=Sum('amount'))['t'] or 0

        # Meta mensual
        from ..models import SystemSettings
        try:
            settings_obj = SystemSettings.objects.filter(user=request.user).first()
            monthly_goal = float(settings_obj.monthly_goal) if settings_obj and settings_obj.monthly_goal > 0 else 0
        except Exception:
            monthly_goal = 0

        pct = round((float(total_collected) / monthly_goal * 100), 1) if monthly_goal > 0 else 0

        payments = []
        for inst in paid_installments:
            from decimal import Decimal
            monthly_interest = (inst.loan.amount * inst.loan.interest_rate) / Decimal('100.0')
            total_owed = inst.loan.amount + (monthly_interest * inst.loan.term_months)
            payments.append({
                'id': inst.id,
                'borrower_name': inst.loan.borrower.name,
                'loan_id': inst.loan.id,
                'installment_number': inst.number,
                'amount': float(inst.amount),
                'capital': float(inst.capital),
                'interest': float(inst.interest),
                'paid_at': inst.paid_at.isoformat() if inst.paid_at else None,
                'loan_amount': float(inst.loan.amount),
                'loan_total_owed': float(total_owed),
                'note': inst.note or '',
            })

        # Active/overdue loans summary
        from ..models import Loans
        active_loans = Loans.objects.filter(
            user=request.user, status__in=[Loans.Status.ACTIVE, Loans.Status.OVERDUE]
        ).select_related('borrower').order_by('status')
        loans_summary = []
        for loan in active_loans:
            from decimal import Decimal
            monthly_interest = (loan.amount * loan.interest_rate) / Decimal('100.0')
            total_owed = loan.amount + (monthly_interest * loan.term_months)
            paid = loan.installments.filter(
                status=Installment.Status.PAID
            ).aggregate(t=Sum('capital'))['t'] or Decimal('0.00')
            loans_summary.append({
                'id': loan.id,
                'borrower_name': loan.borrower.name,
                'amount': float(loan.amount),
                'total_owed': float(total_owed),
                'paid': float(paid),
                'remaining': float(total_owed - paid),
                'status': loan.status,
                'start_date': loan.start_date.isoformat() if loan.start_date else None,
                'term_months': loan.term_months,
                'interest_rate': float(loan.interest_rate),
            })

        return Response({
            'month': current_month,
            'year': current_year,
            'monthly_goal': monthly_goal,
            'total_collected': float(total_collected),
            'goal_pct': pct,
            'remaining_goal': max(0, monthly_goal - float(total_collected)),
            'payments': payments,
            'loans_summary': loans_summary,
        })

