import django
import os
import sys

# setup django
sys.path.append('E:\\django\\velty\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from decimal import Decimal
import datetime
from api.models import Loans, Installment

[l.installments.all().delete() for l in Loans.objects.all()]

for loan in Loans.objects.all():
    amount_decimal = loan.amount
    monthly_interest = (amount_decimal * loan.interest_rate) / Decimal('100.0')
    total_interest = monthly_interest * loan.term_months
    total_owed = amount_decimal + total_interest
    start_date = loan.start_date or datetime.date.today()
    num_installments = loan.term_months if loan.payment_frequency == 'MONTHLY' else loan.term_months * 2
    
    if num_installments > 0:
        installment_amount = total_owed / num_installments
        installment_capital = amount_decimal / num_installments
        installment_interest = total_interest / num_installments
        
        installments = []
        for i in range(num_installments):
            if loan.payment_frequency == 'MONTHLY':
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
                status='PENDING'
            ))
        Installment.objects.bulk_create(installments)

print("Done generating installments.")
