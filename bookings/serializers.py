from rest_framework import serializers
from .models import (
    DoctorAvailability, DoctorUnavailability, Appointment,
    AppointmentRating, AppointmentRescheduleRequest, TimeSlot
)
from accounts.serializers import UserSerializer


class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    weekday_name = serializers.CharField(source='get_weekday_display', read_only=True)
    
    class Meta:
        model = DoctorAvailability
        fields = '__all__'
        read_only_fields = ['doctor']


class DoctorUnavailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorUnavailability
        fields = '__all__'
        read_only_fields = ['doctor']


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    doctor_specialization = serializers.SerializerMethodField()
    doctor_years_experience = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    appointment_type_display = serializers.CharField(source='get_appointment_type_display', read_only=True)
    scheduled_datetime = serializers.DateTimeField(read_only=True)
    end_datetime = serializers.DateTimeField(read_only=True)
    can_be_cancelled = serializers.BooleanField(read_only=True)
    
    def get_doctor_specialization(self, obj):
        try:
            return obj.doctor.doctor_profile.specialization
        except:
            return None
    
    def get_doctor_years_experience(self, obj):
        try:
            return obj.doctor.doctor_profile.years_of_experience
        except:
            return None
    
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['patient', 'is_paid', 'payment_method', 'confirmed_at', 'cancelled_at', 'completed_at', 'cancelled_by', 'reminder_sent', 'reminder_sent_at']


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['doctor', 'appointment_type', 'scheduled_date', 'scheduled_time', 'duration', 'chief_complaint', 'notes_from_patient']
        
    def validate_doctor(self, value):
        """Validate that the doctor exists and has a profile"""
        print(f"=== Doctor Validation Debug ===")
        print(f"Doctor value received: {value} (type: {type(value)})")
        
        # value is a User ID, not a DoctorProfile ID
        from accounts.models import User, DoctorProfile
        
        try:
            # Check if value is already a User object or an ID
            if isinstance(value, User):
                user = value
                print(f"Received User object: {user.get_full_name()} (User ID: {user.id})")
            else:
                # value is an ID, get the user
                user = User.objects.get(id=value, role='doctor')
                print(f"Found doctor user: {user.get_full_name()} (User ID: {user.id})")
            
            # Check if user has a doctor profile
            try:
                doctor_profile = user.doctor_profile
                if not doctor_profile.is_approved:
                    print(f"Doctor profile not approved for user {user.id}")
                    raise serializers.ValidationError("Doctor not approved")
                print(f"Doctor profile approved: {doctor_profile.specialization}")
            except DoctorProfile.DoesNotExist:
                print(f"No doctor profile found for user {user.id}")
                raise serializers.ValidationError("Doctor profile not found")
            
            return user
            
        except User.DoesNotExist:
            print(f"User with ID {value} not found or not a doctor")
            raise serializers.ValidationError("Doctor not found")
        
    def validate_scheduled_date(self, value):
        """Validate that the appointment date is allowed (Saturday to Thursday)"""
        weekday = value.weekday()  # Monday=0, Tuesday=1, ..., Sunday=6
        if weekday == 4:  # Friday (4 in Python weekday)
            raise serializers.ValidationError("التواريخ المتاحة من السبت إلى الخميس فقط")
        return value

    def create(self, validated_data):
        # Set consultation fee from doctor profile
        doctor = validated_data['doctor']
        try:
            consultation_fee = doctor.doctor_profile.consultation_fee
            if consultation_fee is None:
                consultation_fee = 0
        except AttributeError:
            consultation_fee = 0
        
        validated_data['consultation_fee'] = consultation_fee
        
        return super().create(validated_data)


class AppointmentRatingSerializer(serializers.ModelSerializer):
    appointment_details = serializers.SerializerMethodField()
    
    class Meta:
        model = AppointmentRating
        fields = '__all__'
        read_only_fields = ['appointment']
    
    def get_appointment_details(self, obj):
        return {
            'doctor_name': obj.appointment.doctor.get_full_name(),
            'date': obj.appointment.scheduled_date,
            'time': obj.appointment.scheduled_time,
        }


class AppointmentRescheduleRequestSerializer(serializers.ModelSerializer):
    appointment_details = serializers.SerializerMethodField()
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    responded_by_name = serializers.CharField(source='responded_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = AppointmentRescheduleRequest
        fields = '__all__'
        read_only_fields = ['requested_by', 'status', 'responded_by', 'responded_at']
    
    def get_appointment_details(self, obj):
        return {
            'patient_name': obj.appointment.patient.get_full_name(),
            'doctor_name': obj.appointment.doctor.get_full_name(),
            'current_date': obj.appointment.scheduled_date,
            'current_time': obj.appointment.scheduled_time,
        }


class TimeSlotSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    is_fully_booked = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = TimeSlot
        fields = '__all__'
        read_only_fields = ['doctor', 'current_appointments']


class AvailableTimeSlotsSerializer(serializers.Serializer):
    date = serializers.DateField()
    doctor_id = serializers.IntegerField()
    
    def validate(self, attrs):
        from datetime import date
        if attrs['date'] < date.today():
            raise serializers.ValidationError("Cannot book appointments in the past")
        return attrs
