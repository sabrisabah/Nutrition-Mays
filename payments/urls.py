from django.urls import path
from . import views

urlpatterns = [
    # Payment Providers
    path('providers/', views.PaymentProviderListView.as_view(), name='payment-providers'),
    
    # Discount Coupons
    path('coupons/', views.DiscountCouponListCreateView.as_view(), name='discount-coupons'),
    path('coupons/<int:pk>/', views.DiscountCouponDetailView.as_view(), name='discount-coupon-detail'),
    path('coupons/validate/', views.validate_coupon, name='validate-coupon'),
    
    # Invoices
    path('invoices/', views.InvoiceListCreateView.as_view(), name='invoices'),
    path('invoices/<int:pk>/', views.InvoiceDetailView.as_view(), name='invoice-detail'),
    
    # Payments
    path('payments/', views.PaymentListCreateView.as_view(), name='payments'),
    path('payments/<int:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    path('payments/<uuid:payment_id>/process/', views.process_payment, name='process-payment'),
    
    # Subscriptions
    path('subscriptions/', views.SubscriptionListCreateView.as_view(), name='subscriptions'),
    
    # Refunds
    path('refunds/', views.RefundListCreateView.as_view(), name='refunds'),
    path('refunds/<int:refund_id>/approve/', views.approve_refund, name='approve-refund'),
    path('refunds/<int:refund_id>/reject/', views.reject_refund, name='reject-refund'),
]
