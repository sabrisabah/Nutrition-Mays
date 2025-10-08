from rest_framework import serializers
from .models import (
    PaymentProvider, DiscountCoupon, Invoice, Payment, 
    CouponUsage, Subscription, Refund
)


class PaymentProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentProvider
        fields = ['id', 'name', 'display_name', 'display_name_ar', 'is_active', 
                 'transaction_fee_percentage', 'transaction_fee_fixed', 'min_amount', 'max_amount']


class DiscountCouponSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    discount_type_display = serializers.CharField(source='get_discount_type_display', read_only=True)
    is_valid_status = serializers.SerializerMethodField()
    
    class Meta:
        model = DiscountCoupon
        fields = '__all__'
        read_only_fields = ['created_by', 'current_uses']
    
    def get_is_valid_status(self, obj):
        is_valid, message = obj.is_valid()
        return {'is_valid': is_valid, 'message': message}


class CouponValidationSerializer(serializers.Serializer):
    code = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    service_type = serializers.ChoiceField(choices=['consultation', 'meal_plan', 'subscription'])


class InvoiceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)
    outstanding_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['invoice_number', 'user', 'paid_amount', 'status', 'paid_date']


class PaymentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['payment_id', 'user', 'fee_amount', 'net_amount', 'status', 
                           'provider_transaction_id', 'provider_response', 'processed_at', 'completed_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['invoice', 'provider', 'amount']
    
    def create(self, validated_data):
        # Calculate fees
        provider = validated_data['provider']
        amount = validated_data['amount']
        fee_amount = provider.calculate_fee(amount)
        net_amount = amount - fee_amount
        
        validated_data['fee_amount'] = fee_amount
        validated_data['net_amount'] = net_amount
        
        return super().create(validated_data)


class CouponUsageSerializer(serializers.ModelSerializer):
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    
    class Meta:
        model = CouponUsage
        fields = '__all__'


class SubscriptionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    plan_display = serializers.CharField(source='get_plan_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Subscription
        fields = '__all__'
        read_only_fields = ['user']


class RefundSerializer(serializers.ModelSerializer):
    payment_id = serializers.CharField(source='payment.payment_id', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Refund
        fields = '__all__'
        read_only_fields = ['requested_by', 'processed_by', 'processed_at']


class InvoiceCreateSerializer(serializers.Serializer):
    service_type = serializers.ChoiceField(choices=[
        ('consultation', 'Consultation'),
        ('meal_plan', 'Meal Plan'),
        ('subscription', 'Subscription'),
    ])
    service_description = serializers.CharField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    appointment_id = serializers.IntegerField(required=False)
    meal_plan_id = serializers.IntegerField(required=False)
    
    def validate(self, attrs):
        service_type = attrs.get('service_type')
        
        if service_type == 'consultation' and not attrs.get('appointment_id'):
            raise serializers.ValidationError("appointment_id is required for consultation invoices")
        
        if service_type == 'meal_plan' and not attrs.get('meal_plan_id'):
            raise serializers.ValidationError("meal_plan_id is required for meal plan invoices")
        
        return attrs
