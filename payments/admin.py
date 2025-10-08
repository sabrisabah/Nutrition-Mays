from django.contrib import admin
from .models import (
    PaymentProvider, DiscountCoupon, Invoice, Payment,
    CouponUsage, Subscription, Refund
)


@admin.register(PaymentProvider)
class PaymentProviderAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name', 'is_active', 'transaction_fee_percentage', 'min_amount', 'max_amount']
    list_filter = ['is_active', 'name']
    search_fields = ['name', 'display_name']
    list_editable = ['is_active']


@admin.register(DiscountCoupon)
class DiscountCouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'discount_type', 'discount_value', 'current_uses', 'max_uses', 'is_active', 'valid_until']
    list_filter = ['discount_type', 'is_active', 'valid_from', 'valid_until']
    search_fields = ['code', 'name']
    list_editable = ['is_active']
    readonly_fields = ['current_uses']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'user', 'service_type', 'subtotal', 'discount_amount', 'total_amount', 'status', 'issue_date']
    list_filter = ['status', 'service_type', 'issue_date']
    search_fields = ['invoice_number', 'user__username', 'user__email']
    readonly_fields = ['invoice_number', 'outstanding_amount']
    date_hierarchy = 'issue_date'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_id', 'user', 'provider', 'amount', 'fee_amount', 'status', 'created_at']
    list_filter = ['status', 'provider', 'created_at']
    search_fields = ['payment_id', 'user__username', 'provider_transaction_id']
    readonly_fields = ['payment_id', 'net_amount']
    date_hierarchy = 'created_at'


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = ['coupon', 'user', 'invoice', 'discount_amount', 'used_at']
    list_filter = ['used_at']
    search_fields = ['coupon__code', 'user__username', 'invoice__invoice_number']
    date_hierarchy = 'used_at'


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'start_date', 'end_date', 'monthly_fee', 'status', 'is_active']
    list_filter = ['plan', 'status', 'start_date', 'end_date']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['is_active']


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ['payment', 'amount', 'status', 'requested_by', 'processed_by', 'requested_at']
    list_filter = ['status', 'requested_at']
    search_fields = ['payment__payment_id', 'requested_by__username']
    date_hierarchy = 'requested_at'
