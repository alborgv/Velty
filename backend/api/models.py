from django.db import models
from django.contrib.auth.models import User
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

class Borrower(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    name: str = models.CharField(
        max_length=250,
        null=False,
        blank=True
    )
    phone: Optional[str] = models.CharField(
        max_length=250,
        null=True,
        blank=True
    )
    note: Optional[str] = models.CharField(
        max_length=250,
        null=True,
        blank=True
    )
    
    def __str__(self) -> str:
        return self.name
    

class SystemSettings(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    monthly_goal = models.DecimalField(max_digits=200, decimal_places=2, default=0)
    
    def __str__(self):
        return "Configuración del Sistema"

    

class Loans(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Activo / En Pago'
        PAID = 'PAID', 'Pagado'
        OVERDUE = 'OVERDUE', 'En Mora'

    class PaymentFrequency(models.TextChoices):
        MONTHLY = 'MONTHLY', 'Mensual'
        BIWEEKLY = 'BIWEEKLY', 'Quincenal'

    
    borrower: Borrower = models.ForeignKey(Borrower, on_delete=models.CASCADE, help_text="Cliente de este préstamo")
    amount: Decimal = models.DecimalField(max_digits=200, decimal_places=2)
    start_date: Optional[date] = models.DateField(null=True, blank=True)
    status: str = models.CharField(
        max_length=20, 
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    term_months: int = models.PositiveIntegerField()
    interest_rate: Decimal = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    payment_frequency: str = models.CharField(
        max_length=20,
        choices=PaymentFrequency.choices,
        default=PaymentFrequency.MONTHLY,
    )
    created_at: datetime =  models.DateTimeField(auto_now_add=True)
    

    def __str__(self):
        return self.borrower.name
    

class Installment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pendiente'
        PAID = 'PAID', 'Pagado'
        OVERDUE = 'OVERDUE', 'En Mora'
    
    loan: Loans = models.ForeignKey(Loans,
        on_delete=models.CASCADE, 
        related_name='installments'
    )
    
    number: int = models.PositiveIntegerField()
    due_date: date = models.DateField()
    amount: Decimal = models.DecimalField(max_digits=200, decimal_places=2)
    capital: Decimal = models.DecimalField(max_digits=200, decimal_places=2)
    interest: Decimal = models.DecimalField(max_digits=200, decimal_places=2)
    
    status: str = models.CharField(
        max_length=10, 
        choices=Status.choices, 
        default=Status.PENDING
    )
    
    paid_at: date = models.DateField(null=True, blank=True)
    note: str = models.TextField(null=True, blank=True)
    created_at: datetime =  models.DateTimeField(auto_now_add=True)
        
    def __str__(self) -> str:
        return f"Cuota {self.number} - {self.loan.id}"