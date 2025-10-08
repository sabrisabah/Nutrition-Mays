from django.urls import path
from . import views

urlpatterns = [
    # Doctor Availability
    path('availability/', views.DoctorAvailabilityListCreateView.as_view(), name='doctor-availability'),
    path('availability/<int:pk>/', views.DoctorAvailabilityDetailView.as_view(), name='doctor-availability-detail'),
    path('unavailability/', views.DoctorUnavailabilityListCreateView.as_view(), name='doctor-unavailability'),
    
    # Appointments
    path('appointments/', views.AppointmentListCreateView.as_view(), name='appointments'),
    path('appointments/<int:pk>/', views.AppointmentDetailView.as_view(), name='appointment-detail'),
    path('appointments/<int:appointment_id>/confirm/', views.confirm_appointment, name='confirm-appointment'),
    path('appointments/<int:appointment_id>/cancel/', views.cancel_appointment, name='cancel-appointment'),
    path('appointments/<int:appointment_id>/complete/', views.complete_appointment, name='complete-appointment'),
    
    # Available Time Slots
    path('available-slots/', views.available_time_slots, name='available-time-slots'),
    
    # Ratings
    path('ratings/', views.AppointmentRatingListCreateView.as_view(), name='appointment-ratings'),
    
    # Reschedule Requests
    path('reschedule-requests/', views.AppointmentRescheduleRequestListCreateView.as_view(), name='reschedule-requests'),
    path('reschedule-requests/<int:request_id>/approve/', views.approve_reschedule_request, name='approve-reschedule'),
    path('reschedule-requests/<int:request_id>/reject/', views.reject_reschedule_request, name='reject-reschedule'),
]
