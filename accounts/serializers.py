from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, PatientProfile, DoctorProfile, PatientMeasurement, MedicalDocument


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    # Physical information fields
    gender = serializers.CharField(write_only=True, required=False, allow_blank=True)
    height = serializers.FloatField(write_only=True, required=False, allow_null=True)
    current_weight = serializers.FloatField(write_only=True, required=False, allow_null=True)
    goal = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'password', 'password_confirm', 'role', 'phone',
                 'gender', 'height', 'current_weight', 'goal']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        # Extract physical information with defaults
        gender = validated_data.pop('gender', 'male')
        height = validated_data.pop('height', 175.0)
        current_weight = validated_data.pop('current_weight', 70.0)
        goal = validated_data.pop('goal', 'maintain_weight')
        
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create patient profile with physical information
        PatientProfile.objects.create(
            user=user,
            gender=gender or 'male',
            height=height or 175.0,
            current_weight=current_weight or 70.0,
            goal=goal or 'maintain_weight',
            activity_level='moderate'  # Default value
        )
        
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')
        
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'phone', 'avatar', 'date_of_birth', 'address', 'is_verified']
        read_only_fields = ['id', 'username']


class PatientProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = PatientProfile
        fields = '__all__'
        read_only_fields = ['user']


class PatientProfileForPatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = PatientProfile
        fields = ['id', 'user', 'gender', 'height', 'current_weight', 'target_weight', 'goal', 
                 'medical_conditions', 'dietary_restrictions', 'medications', 'emergency_contact', 
                 'emergency_phone', 'created_at', 'updated_at']
        read_only_fields = ['user', 'gender', 'height', 'current_weight', 'goal']


class DoctorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = DoctorProfile
        fields = '__all__'
        read_only_fields = ['user', 'is_approved', 'rating', 'total_reviews']
    
    def validate_years_of_experience(self, value):
        if value < 0:
            raise serializers.ValidationError("سنوات الخبرة يجب أن تكون صفر أو أكثر")
        return value
    
    def validate_consultation_fee(self, value):
        if value < 0:
            raise serializers.ValidationError("رسوم الاستشارة يجب أن تكون صفر أو أكثر")
        return value


class PatientMeasurementSerializer(serializers.ModelSerializer):
    adjusted_body_weight = serializers.ReadOnlyField()
    auto_update_profile = serializers.BooleanField(write_only=True, default=True, help_text='تحديث ملف المريض تلقائياً بالوزن الجديد')
    
    class Meta:
        model = PatientMeasurement
        fields = '__all__'
        read_only_fields = ['patient', 'adjusted_body_weight']
    
    def create(self, validated_data):
        # Remove auto_update_profile from validated_data before creating the object
        auto_update_profile = validated_data.pop('auto_update_profile', True)
        
        # Create the measurement object
        measurement = PatientMeasurement.objects.create(**validated_data)
        
        # Handle auto_update_profile logic
        if auto_update_profile and measurement.weight and measurement.patient and measurement.patient.patient_profile:
            profile = measurement.patient.patient_profile
            profile.current_weight = measurement.weight
            if measurement.activity_level:
                profile.activity_level = measurement.activity_level
            profile.save()
        
        return measurement


class MedicalDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = MedicalDocument
        fields = '__all__'
        read_only_fields = ['patient', 'uploaded_by']
