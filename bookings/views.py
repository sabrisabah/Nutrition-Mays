from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from datetime import datetime, date, timedelta, time
from .models import (
    DoctorAvailability, DoctorUnavailability, Appointment,
    AppointmentRating, AppointmentRescheduleRequest, TimeSlot
)
from .serializers import (
    DoctorAvailabilitySerializer, DoctorUnavailabilitySerializer,
    AppointmentSerializer, AppointmentCreateSerializer, AppointmentRatingSerializer,
    AppointmentRescheduleRequestSerializer, TimeSlotSerializer, AvailableTimeSlotsSerializer
)


class DoctorAvailabilityListCreateView(generics.ListCreateAPIView):
    serializer_class = DoctorAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'doctor':
            return DoctorAvailability.objects.filter(doctor=self.request.user)
        elif self.request.user.role in ['admin', 'patient']:
            doctor_id = self.request.query_params.get('doctor_id')
            if doctor_id:
                return DoctorAvailability.objects.filter(doctor_id=doctor_id, is_available=True)
            return DoctorAvailability.objects.filter(is_available=True)
        return DoctorAvailability.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)


class DoctorAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DoctorAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'doctor':
            return DoctorAvailability.objects.filter(doctor=self.request.user)
        elif self.request.user.role == 'admin':
            return DoctorAvailability.objects.all()
        return DoctorAvailability.objects.none()
    
    def perform_destroy(self, instance):
        # Only allow doctor to delete their own availability or admin
        if self.request.user.role == 'doctor' and instance.doctor != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own availability slots")
        instance.delete()


class DoctorUnavailabilityListCreateView(generics.ListCreateAPIView):
    serializer_class = DoctorUnavailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'doctor':
            return DoctorUnavailability.objects.filter(doctor=self.request.user)
        elif self.request.user.role == 'admin':
            doctor_id = self.request.query_params.get('doctor_id')
            if doctor_id:
                return DoctorUnavailability.objects.filter(doctor_id=doctor_id)
            return DoctorUnavailability.objects.all()
        return DoctorUnavailability.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)


class AppointmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'appointment_type', 'scheduled_date']
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return Appointment.objects.filter(patient=self.request.user).order_by('-created_at')
        elif self.request.user.role == 'doctor':
            return Appointment.objects.filter(doctor=self.request.user).order_by('-created_at')
        elif self.request.user.role in ['admin', 'accountant']:
            return Appointment.objects.all().order_by('-created_at')
        return Appointment.objects.none()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentCreateSerializer
        return AppointmentSerializer
    
    def create(self, request, *args, **kwargs):
        print(f"=== Appointment Creation Debug ===")
        print(f"Request data: {request.data}")
        print(f"User: {request.user.username} (ID: {request.user.id}, Role: {request.user.role})")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return Appointment.objects.filter(patient=self.request.user)
        elif self.request.user.role == 'doctor':
            return Appointment.objects.filter(doctor=self.request.user)
        elif self.request.user.role in ['admin', 'accountant']:
            return Appointment.objects.all()
        return Appointment.objects.none()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_appointment(request, appointment_id):
    try:
        appointment = Appointment.objects.get(id=appointment_id)
        
        # Only doctor or admin can confirm
        if request.user.role not in ['doctor', 'admin'] and appointment.doctor != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        appointment.confirm()
        return Response({'message': 'Appointment confirmed successfully'})
        
    except Appointment.DoesNotExist:
        return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_appointment(request, appointment_id):
    try:
        appointment = Appointment.objects.get(id=appointment_id)
        
        # Patient can cancel their own appointments, doctor can cancel theirs
        if request.user.role == 'patient' and appointment.patient != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role == 'doctor' and appointment.doctor != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        reason = request.data.get('reason', '')
        appointment.cancel(request.user, reason)
        
        return Response({'message': 'Appointment cancelled successfully'})
        
    except Appointment.DoesNotExist:
        return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_appointment(request, appointment_id):
    try:
        appointment = Appointment.objects.get(id=appointment_id)
        
        # Only doctor can complete appointments
        if request.user.role != 'doctor' or appointment.doctor != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Update doctor notes and recommendations if provided
        notes = request.data.get('notes_from_doctor', '')
        recommendations = request.data.get('recommendations', '')
        
        if notes:
            appointment.notes_from_doctor = notes
        if recommendations:
            appointment.recommendations = recommendations
        
        appointment.complete()
        
        return Response({'message': 'Appointment completed successfully'})
        
    except Appointment.DoesNotExist:
        return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_time_slots(request):
    serializer = AvailableTimeSlotsSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    target_date = serializer.validated_data['date']
    doctor_id = serializer.validated_data['doctor_id']
    
    # Check if date is allowed (Saturday to Thursday, not Friday)
    weekday = target_date.weekday()  # Monday=0, Tuesday=1, ..., Sunday=6
    if weekday == 4:  # Friday (4 in Python weekday)
        return Response({
            'date': target_date,
            'doctor_id': doctor_id,
            'available_slots': [],
            'message': 'التواريخ المتاحة من السبت إلى الخميس فقط'
        })
    
    # Get doctor availability for the day of week
    availability_slots = DoctorAvailability.objects.filter(
        doctor_id=doctor_id,
        weekday=weekday,
        is_available=True
    )
    
    # Get existing appointments for the date
    existing_appointments = Appointment.objects.filter(
        doctor_id=doctor_id,
        scheduled_date=target_date,
        status__in=['pending', 'confirmed']
    ).values_list('scheduled_time', 'duration')
    
    # Get unavailability periods
    unavailable_periods = DoctorUnavailability.objects.filter(
        doctor_id=doctor_id,
        start_datetime__date__lte=target_date,
        end_datetime__date__gte=target_date
    )
    
    available_slots = []
    
    for slot in availability_slots:
        current_time = slot.start_time
        slot_duration = 30  # Default 30 minutes per slot
        
        while current_time < slot.end_time:
            slot_end_time = (datetime.combine(date.today(), current_time) + timedelta(minutes=slot_duration)).time()
            
            if slot_end_time > slot.end_time:
                break
            
            # Check if slot is already booked
            is_booked = any(
                current_time == appt_time for appt_time, duration in existing_appointments
            )
            
            # Check if slot conflicts with unavailability
            slot_datetime = datetime.combine(target_date, current_time)
            slot_end_datetime = slot_datetime + timedelta(minutes=slot_duration)
            
            is_unavailable = any(
                unavail.start_datetime < slot_end_datetime and unavail.end_datetime > slot_datetime
                for unavail in unavailable_periods
            )
            
            if not is_booked and not is_unavailable:
                available_slots.append({
                    'time': current_time,
                    'end_time': slot_end_time,
                    'duration': slot_duration,
                    'available': True
                })
            
            current_time = slot_end_time
    
    return Response({
        'date': target_date,
        'doctor_id': doctor_id,
        'available_slots': available_slots
    })


class AppointmentRatingListCreateView(generics.ListCreateAPIView):
    serializer_class = AppointmentRatingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return AppointmentRating.objects.filter(appointment__patient=self.request.user)
        elif self.request.user.role == 'doctor':
            return AppointmentRating.objects.filter(appointment__doctor=self.request.user)
        elif self.request.user.role in ['admin', 'accountant']:
            return AppointmentRating.objects.all()
        return AppointmentRating.objects.none()
    
    def perform_create(self, serializer):
        appointment_id = self.request.data.get('appointment_id')
        try:
            appointment = Appointment.objects.get(
                id=appointment_id,
                patient=self.request.user,
                status='completed'
            )
            serializer.save(appointment=appointment)
        except Appointment.DoesNotExist:
            from rest_framework import serializers
            raise serializers.ValidationError("Invalid appointment or not completed")


class AppointmentRescheduleRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = AppointmentRescheduleRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return AppointmentRescheduleRequest.objects.filter(appointment__patient=self.request.user)
        elif self.request.user.role == 'doctor':
            return AppointmentRescheduleRequest.objects.filter(appointment__doctor=self.request.user)
        elif self.request.user.role in ['admin', 'accountant']:
            return AppointmentRescheduleRequest.objects.all()
        return AppointmentRescheduleRequest.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_reschedule_request(request, request_id):
    try:
        reschedule_request = AppointmentRescheduleRequest.objects.get(id=request_id)
        
        # Only doctor or admin can approve
        if request.user.role not in ['doctor', 'admin'] and reschedule_request.appointment.doctor != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        reschedule_request.approve(request.user)
        return Response({'message': 'Reschedule request approved successfully'})
        
    except AppointmentRescheduleRequest.DoesNotExist:
        return Response({'error': 'Reschedule request not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_reschedule_request(request, request_id):
    try:
        reschedule_request = AppointmentRescheduleRequest.objects.get(id=request_id)
        
        # Only doctor or admin can reject
        if request.user.role not in ['doctor', 'admin'] and reschedule_request.appointment.doctor != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        reason = request.data.get('reason', '')
        reschedule_request.reject(request.user, reason)
        
        return Response({'message': 'Reschedule request rejected successfully'})
        
    except AppointmentRescheduleRequest.DoesNotExist:
        return Response({'error': 'Reschedule request not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
