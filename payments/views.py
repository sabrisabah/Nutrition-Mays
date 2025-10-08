from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import uuid

from .models import (
    PaymentProvider, DiscountCoupon, Invoice, Payment,
    CouponUsage, Subscription, Refund
)
from .serializers import (
    PaymentProviderSerializer, DiscountCouponSerializer, InvoiceSerializer,
    PaymentSerializer, PaymentCreateSerializer, CouponUsageSerializer,
    SubscriptionSerializer, RefundSerializer, CouponValidationSerializer,
    InvoiceCreateSerializer
)


class PaymentProviderListView(generics.ListAPIView):
    queryset = PaymentProvider.objects.filter(is_active=True)
    serializer_class = PaymentProviderSerializer
    permission_classes = [permissions.IsAuthenticated]


class DiscountCouponListCreateView(generics.ListCreateAPIView):
    serializer_class = DiscountCouponSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'discount_type']
    
    def get_queryset(self):
        if self.request.user.role in ['admin']:
            return DiscountCoupon.objects.all()
        return DiscountCoupon.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DiscountCouponDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DiscountCouponSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role in ['admin']:
            return DiscountCoupon.objects.all()
        return DiscountCoupon.objects.filter(created_by=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def validate_coupon(request):
    serializer = CouponValidationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    code = serializer.validated_data['code']
    amount = serializer.validated_data['amount']
    service_type = serializer.validated_data['service_type']
    
    try:
        coupon = DiscountCoupon.objects.get(code=code)
        
        # Check if coupon is valid
        is_valid, message = coupon.is_valid()
        if not is_valid:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user can use this coupon
        if not coupon.can_be_used_by_user(request.user):
            return Response({'error': 'You have already used this coupon maximum times'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check service type applicability
        if service_type == 'consultation' and not coupon.applicable_to_consultations:
            return Response({'error': 'This coupon is not applicable to consultations'}, status=status.HTTP_400_BAD_REQUEST)
        
        if service_type == 'meal_plan' and not coupon.applicable_to_meal_plans:
            return Response({'error': 'This coupon is not applicable to meal plans'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate discount
        discount_amount = coupon.calculate_discount(amount)
        final_amount = amount - discount_amount
        
        return Response({
            'valid': True,
            'coupon': DiscountCouponSerializer(coupon).data,
            'original_amount': amount,
            'discount_amount': discount_amount,
            'final_amount': final_amount
        })
        
    except DiscountCoupon.DoesNotExist:
        return Response({'error': 'Invalid coupon code'}, status=status.HTTP_404_NOT_FOUND)


class InvoiceListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'service_type']
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return Invoice.objects.filter(user=self.request.user)
        elif self.request.user.role in ['admin', 'accountant']:
            return Invoice.objects.all()
        elif self.request.user.role == 'doctor':
            # Doctors can see invoices for their appointments/meal plans
            return Invoice.objects.filter(
                Q(appointment__doctor=self.request.user) | 
                Q(meal_plan__doctor=self.request.user)
            )
        return Invoice.objects.none()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InvoiceCreateSerializer
        return InvoiceSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create invoice
        invoice_data = serializer.validated_data
        
        # Generate invoice number
        invoice_number = f"INV-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        
        invoice = Invoice.objects.create(
            invoice_number=invoice_number,
            user=request.user,
            service_type=invoice_data['service_type'],
            service_description=invoice_data['service_description'],
            subtotal=invoice_data['subtotal'],
            appointment_id=invoice_data.get('appointment_id'),
            meal_plan_id=invoice_data.get('meal_plan_id'),
            due_date=timezone.now().date() + timedelta(days=7),
            status='pending'
        )
        
        # Apply coupon if provided
        coupon_code = invoice_data.get('coupon_code')
        if coupon_code:
            try:
                coupon = DiscountCoupon.objects.get(code=coupon_code)
                is_valid, message = coupon.is_valid()
                
                if is_valid and coupon.can_be_used_by_user(request.user):
                    discount_amount = coupon.calculate_discount(invoice.subtotal)
                    invoice.coupon = coupon
                    invoice.discount_amount = discount_amount
            except DiscountCoupon.DoesNotExist:
                pass
        
        # Calculate total
        invoice.total_amount = invoice.subtotal - invoice.discount_amount + invoice.tax_amount
        invoice.save()
        
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


class InvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return Invoice.objects.filter(user=self.request.user)
        elif self.request.user.role in ['admin', 'accountant']:
            return Invoice.objects.all()
        elif self.request.user.role == 'doctor':
            return Invoice.objects.filter(
                Q(appointment__doctor=self.request.user) | 
                Q(meal_plan__doctor=self.request.user)
            )
        return Invoice.objects.none()


class PaymentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'provider']
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return Payment.objects.filter(user=self.request.user)
        elif self.request.user.role in ['admin', 'accountant']:
            return Payment.objects.all()
        elif self.request.user.role == 'doctor':
            return Payment.objects.filter(
                Q(invoice__appointment__doctor=self.request.user) |
                Q(invoice__meal_plan__doctor=self.request.user)
            )
        return Payment.objects.none()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentCreateSerializer
        return PaymentSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PaymentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return Payment.objects.filter(user=self.request.user)
        elif self.request.user.role in ['admin', 'accountant']:
            return Payment.objects.all()
        elif self.request.user.role == 'doctor':
            return Payment.objects.filter(
                Q(invoice__appointment__doctor=self.request.user) |
                Q(invoice__meal_plan__doctor=self.request.user)
            )
        return Payment.objects.none()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def process_payment(request, payment_id):
    """Process payment with selected provider"""
    try:
        payment = Payment.objects.get(payment_id=payment_id, user=request.user)
        
        if payment.status != 'pending':
            return Response({'error': 'Payment is not in pending status'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Here you would integrate with actual payment providers
        # For now, we'll simulate the process
        
        payment.status = 'processing'
        payment.processed_at = timezone.now()
        payment.save()
        
        # Simulate successful payment (in real implementation, this would be handled by webhooks)
        payment.mark_as_completed()
        
        return Response({
            'message': 'Payment processed successfully',
            'payment': PaymentSerializer(payment).data
        })
        
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)


class SubscriptionListCreateView(generics.ListCreateAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return Subscription.objects.filter(user=self.request.user)
        elif self.request.user.role in ['admin', 'accountant']:
            return Subscription.objects.all()
        return Subscription.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RefundListCreateView(generics.ListCreateAPIView):
    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return Refund.objects.filter(requested_by=self.request.user)
        elif self.request.user.role in ['admin', 'accountant']:
            return Refund.objects.all()
        return Refund.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_refund(request, refund_id):
    """Approve a refund request"""
    if request.user.role not in ['admin', 'accountant']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        refund = Refund.objects.get(id=refund_id)
        
        if refund.status != 'requested':
            return Response({'error': 'Refund is not in requested status'}, status=status.HTTP_400_BAD_REQUEST)
        
        refund.status = 'approved'
        refund.processed_by = request.user
        refund.processed_at = timezone.now()
        refund.admin_notes = request.data.get('admin_notes', '')
        refund.save()
        
        return Response({'message': 'Refund approved successfully'})
        
    except Refund.DoesNotExist:
        return Response({'error': 'Refund not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_refund(request, refund_id):
    """Reject a refund request"""
    if request.user.role not in ['admin', 'accountant']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        refund = Refund.objects.get(id=refund_id)
        
        if refund.status != 'requested':
            return Response({'error': 'Refund is not in requested status'}, status=status.HTTP_400_BAD_REQUEST)
        
        refund.status = 'rejected'
        refund.processed_by = request.user
        refund.processed_at = timezone.now()
        refund.admin_notes = request.data.get('admin_notes', '')
        refund.save()
        
        return Response({'message': 'Refund rejected successfully'})
        
    except Refund.DoesNotExist:
        return Response({'error': 'Refund not found'}, status=status.HTTP_404_NOT_FOUND)
