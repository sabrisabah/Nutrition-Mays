from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
import uuid

User = get_user_model()


class PaymentProvider(models.Model):
    PROVIDER_CHOICES = [
        ('zaincash', 'ZainCash'),
        ('asiahawala', 'AsiaHawala'),
        ('qicard', 'QiCard'),
        ('switch', 'Switch'),
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
    ]
    
    name = models.CharField(max_length=50, choices=PROVIDER_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    display_name_ar = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    transaction_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    transaction_fee_fixed = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_amount = models.DecimalField(max_digits=10, decimal_places=2, default=999999)
    
    # API Configuration
    api_url = models.URLField(blank=True)
    merchant_id = models.CharField(max_length=200, blank=True)
    secret_key = models.CharField(max_length=500, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name

    def calculate_fee(self, amount):
        """Calculate transaction fee for given amount"""
        percentage_fee = amount * (self.transaction_fee_percentage / 100)
        return percentage_fee + self.transaction_fee_fixed


class DiscountCoupon(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', _('Percentage')),
        ('fixed', _('Fixed Amount')),
    ]
    
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    name_ar = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Usage limits
    max_uses = models.IntegerField(blank=True, null=True, help_text=_('Maximum total uses'))
    max_uses_per_user = models.IntegerField(default=1, help_text=_('Maximum uses per user'))
    current_uses = models.IntegerField(default=0)
    
    # Validity
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    
    # Conditions
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Applicable services
    applicable_to_consultations = models.BooleanField(default=True)
    applicable_to_meal_plans = models.BooleanField(default=True)
    
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_coupons')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

    def is_valid(self):
        """Check if coupon is currently valid"""
        from django.utils import timezone
        now = timezone.now()
        
        if not self.is_active:
            return False, "Coupon is inactive"
        
        if now < self.valid_from:
            return False, "Coupon is not yet valid"
        
        if now > self.valid_until:
            return False, "Coupon has expired"
        
        if self.max_uses and self.current_uses >= self.max_uses:
            return False, "Coupon usage limit reached"
        
        return True, "Valid"

    def can_be_used_by_user(self, user):
        """Check if user can use this coupon"""
        user_usage_count = CouponUsage.objects.filter(coupon=self, user=user).count()
        return user_usage_count < self.max_uses_per_user

    def calculate_discount(self, amount):
        """Calculate discount amount for given order amount"""
        if amount < self.min_order_amount:
            return Decimal('0')
        
        if self.discount_type == 'percentage':
            discount = amount * (self.discount_value / 100)
        else:  # fixed
            discount = self.discount_value
        
        # Apply maximum discount limit if set
        if self.max_discount_amount and discount > self.max_discount_amount:
            discount = self.max_discount_amount
        
        # Discount cannot exceed the order amount
        if discount > amount:
            discount = amount
        
        return discount


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('draft', _('Draft')),
        ('pending', _('Pending Payment')),
        ('paid', _('Paid')),
        ('partially_paid', _('Partially Paid')),
        ('cancelled', _('Cancelled')),
        ('refunded', _('Refunded')),
    ]
    
    SERVICE_TYPE_CHOICES = [
        ('consultation', _('Consultation')),
        ('meal_plan', _('Meal Plan')),
        ('subscription', _('Subscription')),
    ]
    
    invoice_number = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES)
    service_description = models.TextField()
    
    # Related objects
    appointment = models.ForeignKey('bookings.Appointment', on_delete=models.SET_NULL, null=True, blank=True)
    meal_plan = models.ForeignKey('meal_plans.MealPlan', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Discount details
    coupon = models.ForeignKey(DiscountCoupon, on_delete=models.SET_NULL, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Dates
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    paid_date = models.DateTimeField(blank=True, null=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.get_full_name()}"

    @property
    def outstanding_amount(self):
        return self.total_amount - self.paid_amount

    def mark_as_paid(self, amount=None):
        """Mark invoice as paid"""
        if amount is None:
            amount = self.outstanding_amount
        
        self.paid_amount += amount
        
        if self.paid_amount >= self.total_amount:
            self.status = 'paid'
            from django.utils import timezone
            self.paid_date = timezone.now()
        elif self.paid_amount > 0:
            self.status = 'partially_paid'
        
        self.save()


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('processing', _('Processing')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
        ('cancelled', _('Cancelled')),
        ('refunded', _('Refunded')),
    ]
    
    payment_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    
    provider = models.ForeignKey(PaymentProvider, on_delete=models.CASCADE)
    provider_transaction_id = models.CharField(max_length=200, blank=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Payment details
    payment_method = models.CharField(max_length=100, blank=True)
    payment_reference = models.CharField(max_length=200, blank=True)
    
    # Response data from provider
    provider_response = models.JSONField(blank=True, null=True)
    failure_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Payment {self.payment_id} - {self.amount} - {self.status}"

    def mark_as_completed(self):
        """Mark payment as completed"""
        from django.utils import timezone
        
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
        
        # Update invoice
        self.invoice.mark_as_paid(self.amount)

    def mark_as_failed(self, reason=""):
        """Mark payment as failed"""
        self.status = 'failed'
        self.failure_reason = reason
        self.save()


class CouponUsage(models.Model):
    coupon = models.ForeignKey(DiscountCoupon, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coupon_usages')
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='coupon_usage')
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['coupon', 'invoice']

    def __str__(self):
        return f"{self.coupon.code} used by {self.user.get_full_name()}"


class Subscription(models.Model):
    STATUS_CHOICES = [
        ('active', _('Active')),
        ('expired', _('Expired')),
        ('cancelled', _('Cancelled')),
        ('suspended', _('Suspended')),
    ]
    
    PLAN_CHOICES = [
        ('basic', _('Basic Plan')),
        ('premium', _('Premium Plan')),
        ('professional', _('Professional Plan')),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES)
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Features included
    max_meal_plans = models.IntegerField(default=1)
    max_consultations = models.IntegerField(default=1)
    includes_chat_support = models.BooleanField(default=False)
    includes_progress_tracking = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_plan_display()}"

    @property
    def is_active(self):
        from django.utils import timezone
        return self.status == 'active' and self.end_date >= timezone.now().date()

    def renew(self, months=1):
        """Renew subscription for specified months"""
        from datetime import timedelta
        self.end_date += timedelta(days=30 * months)
        self.status = 'active'
        self.save()


class Refund(models.Model):
    STATUS_CHOICES = [
        ('requested', _('Requested')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
        ('processed', _('Processed')),
    ]
    
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requested_refunds')
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_refunds')
    
    provider_refund_id = models.CharField(max_length=200, blank=True)
    admin_notes = models.TextField(blank=True)
    
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Refund {self.amount} for Payment {self.payment.payment_id}"
