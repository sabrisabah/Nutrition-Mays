from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from payments.models import Payment, Invoice, DiscountCoupon
from bookings.models import Appointment
from accounts.models import User, PatientProfile, DoctorProfile
from meal_plans.models import MealPlan


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def financial_dashboard(request):
    """Financial dashboard for admin/accountant"""
    if request.user.role not in ['admin', 'accountant']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Date filters
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if not start_date or not end_date:
        # Default to current month
        now = timezone.now()
        start_date = now.replace(day=1).date()
        end_date = now.date()
    else:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    # Base querysets
    payments_qs = Payment.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date
    )
    
    invoices_qs = Invoice.objects.filter(
        issue_date__gte=start_date,
        issue_date__lte=end_date
    )
    
    # Revenue metrics
    total_revenue = payments_qs.filter(status='completed').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0')
    
    total_fees = payments_qs.filter(status='completed').aggregate(
        total=Sum('fee_amount')
    )['total'] or Decimal('0')
    
    net_revenue = total_revenue - total_fees
    
    # Payment status breakdown
    payment_status = payments_qs.values('status').annotate(
        count=Count('id'),
        amount=Sum('amount')
    ).order_by('status')
    
    # Revenue by provider
    revenue_by_provider = payments_qs.filter(status='completed').values(
        'provider__display_name'
    ).annotate(
        count=Count('id'),
        amount=Sum('amount'),
        fees=Sum('fee_amount')
    ).order_by('-amount')
    
    # Revenue by service type
    revenue_by_service = invoices_qs.filter(status='paid').values(
        'service_type'
    ).annotate(
        count=Count('id'),
        amount=Sum('total_amount')
    ).order_by('-amount')
    
    # Doctor performance
    doctor_revenue = invoices_qs.filter(
        status='paid',
        appointment__isnull=False
    ).values(
        'appointment__doctor__first_name',
        'appointment__doctor__last_name'
    ).annotate(
        appointments_count=Count('appointment'),
        total_revenue=Sum('total_amount')
    ).order_by('-total_revenue')[:10]
    
    # Discount usage
    total_discounts = invoices_qs.aggregate(
        total=Sum('discount_amount')
    )['total'] or Decimal('0')
    
    coupon_usage = invoices_qs.filter(
        coupon__isnull=False
    ).values(
        'coupon__code',
        'coupon__name'
    ).annotate(
        usage_count=Count('id'),
        total_discount=Sum('discount_amount')
    ).order_by('-usage_count')[:10]
    
    # Monthly trend (last 12 months)
    monthly_revenue = []
    for i in range(12):
        month_start = (timezone.now() - timedelta(days=30*i)).replace(day=1).date()
        month_end = (month_start.replace(month=month_start.month+1) - timedelta(days=1)) if month_start.month < 12 else month_start.replace(month=12, day=31)
        
        month_payments = Payment.objects.filter(
            created_at__date__gte=month_start,
            created_at__date__lte=month_end,
            status='completed'
        ).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        monthly_revenue.append({
            'month': month_start.strftime('%Y-%m'),
            'revenue': float(month_payments)
        })
    
    monthly_revenue.reverse()
    
    # Outstanding invoices
    outstanding_invoices = Invoice.objects.filter(
        status__in=['pending', 'partially_paid']
    ).aggregate(
        count=Count('id'),
        amount=Sum('total_amount') - Sum('paid_amount')
    )
    
    return Response({
        'period': {
            'start_date': start_date,
            'end_date': end_date
        },
        'revenue_metrics': {
            'total_revenue': float(total_revenue),
            'total_fees': float(total_fees),
            'net_revenue': float(net_revenue),
            'total_discounts': float(total_discounts)
        },
        'payment_status': list(payment_status),
        'revenue_by_provider': list(revenue_by_provider),
        'revenue_by_service': list(revenue_by_service),
        'doctor_performance': list(doctor_revenue),
        'coupon_usage': list(coupon_usage),
        'monthly_trend': monthly_revenue,
        'outstanding_invoices': outstanding_invoices
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def appointments_dashboard(request):
    """Appointments dashboard"""
    if request.user.role not in ['admin', 'doctor']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Date filters
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if not start_date or not end_date:
        # Default to current month
        now = timezone.now()
        start_date = now.replace(day=1).date()
        end_date = now.date()
    else:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    # Base queryset
    appointments_qs = Appointment.objects.filter(
        scheduled_date__gte=start_date,
        scheduled_date__lte=end_date
    )
    
    if request.user.role == 'doctor':
        appointments_qs = appointments_qs.filter(doctor=request.user)
    
    # Appointment status breakdown
    status_breakdown = appointments_qs.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    # Appointment type breakdown
    type_breakdown = appointments_qs.values('appointment_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Daily appointments trend
    daily_appointments = []
    current_date = start_date
    while current_date <= end_date:
        daily_count = appointments_qs.filter(scheduled_date=current_date).count()
        daily_appointments.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'count': daily_count
        })
        current_date += timedelta(days=1)
    
    # Doctor performance (admin only)
    doctor_stats = []
    if request.user.role == 'admin':
        doctor_stats = appointments_qs.values(
            'doctor__first_name',
            'doctor__last_name'
        ).annotate(
            total_appointments=Count('id'),
            completed_appointments=Count('id', filter=Q(status='completed')),
            cancelled_appointments=Count('id', filter=Q(status='cancelled')),
            avg_rating=Avg('rating__rating')
        ).order_by('-total_appointments')[:10]
    
    # Peak hours analysis
    peak_hours = appointments_qs.extra(
        select={'hour': 'EXTRACT(hour FROM scheduled_time)'}
    ).values('hour').annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    return Response({
        'period': {
            'start_date': start_date,
            'end_date': end_date
        },
        'status_breakdown': list(status_breakdown),
        'type_breakdown': list(type_breakdown),
        'daily_trend': daily_appointments,
        'doctor_stats': list(doctor_stats),
        'peak_hours': list(peak_hours)
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def patients_dashboard(request):
    """Patients dashboard for admin/doctor"""
    if request.user.role not in ['admin', 'doctor']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Base queryset
    patients_qs = User.objects.filter(role='patient')
    
    if request.user.role == 'doctor':
        # Filter to patients who have appointments with this doctor
        patients_qs = patients_qs.filter(appointments__doctor=request.user).distinct()
    
    # Patient demographics
    total_patients = patients_qs.count()
    
    # Gender distribution
    gender_distribution = PatientProfile.objects.filter(
        user__in=patients_qs
    ).values('gender').annotate(
        count=Count('id')
    ).order_by('gender')
    
    # Age groups
    from django.utils import timezone
    current_year = timezone.now().year
    
    age_groups = PatientProfile.objects.filter(
        user__in=patients_qs,
        user__date_of_birth__isnull=False
    ).extra(
        select={'age_group': 
            "CASE "
            "WHEN EXTRACT(year FROM age(date_of_birth)) < 18 THEN 'Under 18' "
            "WHEN EXTRACT(year FROM age(date_of_birth)) BETWEEN 18 AND 30 THEN '18-30' "
            "WHEN EXTRACT(year FROM age(date_of_birth)) BETWEEN 31 AND 45 THEN '31-45' "
            "WHEN EXTRACT(year FROM age(date_of_birth)) BETWEEN 46 AND 60 THEN '46-60' "
            "ELSE 'Over 60' END"
        }
    ).values('age_group').annotate(
        count=Count('id')
    ).order_by('age_group')
    
    # Goal distribution
    goal_distribution = PatientProfile.objects.filter(
        user__in=patients_qs
    ).values('goal').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Activity level distribution
    activity_distribution = PatientProfile.objects.filter(
        user__in=patients_qs
    ).values('activity_level').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # New patients trend (last 6 months)
    new_patients_trend = []
    for i in range(6):
        month_start = (timezone.now() - timedelta(days=30*i)).replace(day=1)
        month_end = (month_start.replace(month=month_start.month+1) - timedelta(days=1)) if month_start.month < 12 else month_start.replace(month=12, day=31)
        
        new_count = patients_qs.filter(
            date_joined__gte=month_start,
            date_joined__lte=month_end
        ).count()
        
        new_patients_trend.append({
            'month': month_start.strftime('%Y-%m'),
            'count': new_count
        })
    
    new_patients_trend.reverse()
    
    return Response({
        'total_patients': total_patients,
        'gender_distribution': list(gender_distribution),
        'age_groups': list(age_groups),
        'goal_distribution': list(goal_distribution),
        'activity_distribution': list(activity_distribution),
        'new_patients_trend': new_patients_trend
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def system_overview(request):
    """System overview dashboard for admin"""
    if request.user.role not in ['admin']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # User counts
    user_counts = User.objects.values('role').annotate(
        count=Count('id')
    ).order_by('role')
    
    # Recent activity (last 7 days)
    week_ago = timezone.now() - timedelta(days=7)
    
    recent_stats = {
        'new_users': User.objects.filter(date_joined__gte=week_ago).count(),
        'new_appointments': Appointment.objects.filter(created_at__gte=week_ago).count(),
        'completed_payments': Payment.objects.filter(
            completed_at__gte=week_ago,
            status='completed'
        ).count(),
        'new_meal_plans': MealPlan.objects.filter(created_at__gte=week_ago).count(),
    }
    
    # Top performing doctors
    top_doctors = DoctorProfile.objects.filter(
        is_approved=True
    ).order_by('-rating', '-total_reviews')[:5]
    
    top_doctors_data = [{
        'name': f"Dr. {doctor.user.get_full_name()}",
        'rating': float(doctor.rating),
        'total_reviews': doctor.total_reviews,
        'specialization': doctor.specialization
    } for doctor in top_doctors]
    
    # System health metrics
    health_metrics = {
        'total_revenue_this_month': float(
            Payment.objects.filter(
                created_at__month=timezone.now().month,
                created_at__year=timezone.now().year,
                status='completed'
            ).aggregate(total=Sum('amount'))['total'] or 0
        ),
        'pending_appointments': Appointment.objects.filter(status='pending').count(),
        'active_meal_plans': MealPlan.objects.filter(is_active=True).count(),
        'outstanding_invoices': Invoice.objects.filter(
            status__in=['pending', 'partially_paid']
        ).count(),
    }
    
    return Response({
        'user_counts': list(user_counts),
        'recent_activity': recent_stats,
        'top_doctors': top_doctors_data,
        'health_metrics': health_metrics
    })
