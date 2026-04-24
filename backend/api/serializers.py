from rest_framework import serializers
from .models import *

from django.contrib.auth.models import User
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "password"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
        )
        return user
    
class BorrowerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Borrower
        fields = ['id', 'name', 'phone', 'note', 'user']
        read_only_fields = ['user']
        
class LoansSerializer(serializers.ModelSerializer):
    borrower_name = serializers.CharField(source='borrower.name', read_only=True)
    borrower_phone = serializers.CharField(source='borrower.phone', read_only=True)
    paid_amount = serializers.DecimalField(max_digits=200, decimal_places=2, read_only=True, required=False)
    total_amount_with_interest = serializers.SerializerMethodField()
    computed_status = serializers.SerializerMethodField()

    class Meta:
        model = Loans
        fields = [
            'id', 'borrower', 'borrower_name', 'borrower_phone',
            'amount', 'total_amount_with_interest', 'start_date', 'status', 'computed_status', 'term_months',
            'interest_rate', 'payment_frequency', 'paid_amount', 'created_at', 'user'
        ]
        read_only_fields = ['user']
        
    def get_total_amount_with_interest(self, obj):
        from decimal import Decimal
        # Interest per month: total = amount + (amount * rate/100 * term_months)
        monthly_interest = (obj.amount * obj.interest_rate) / Decimal('100.0')
        total_interest = monthly_interest * obj.term_months
        return obj.amount + total_interest

    def get_computed_status(self, obj):
        """
        Determine status from DB data:
        - PAID: all installments PAID and total_paid >= total_owed
        - OVERDUE: any PENDING installment is past due_date
        - ACTIVE: otherwise
        """
        from decimal import Decimal
        from django.db.models import Sum

        # If already explicitly set to PAID, respect it
        if obj.status == 'PAID':
            return 'PAID'

        # Use annotated has_overdue if present (set by get_queryset in LoanViewSet)
        if getattr(obj, 'has_overdue', False):
            return 'OVERDUE'

        return obj.status
        
        
class InstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installment
        fields = ['id', 'loan', 'number', 'due_date', 'amount', 'capital', 'interest', 'status', 'paid_at', 'created_at']

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = ['monthly_goal']