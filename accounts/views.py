from rest_framework import generics, status, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from .models import User, PatientProfile, DoctorProfile, PatientMeasurement, MedicalDocument
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    PatientProfileSerializer, PatientProfileForPatientSerializer, DoctorProfileSerializer, 
    PatientMeasurementSerializer, MedicalDocumentSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return user


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        request.user.auth_token.delete()
    except:
        pass
    logout(request)
    return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    user_data = UserSerializer(request.user).data
    
    if request.user.role == 'patient':
        try:
            profile = PatientProfile.objects.get(user=request.user)
            user_data['profile'] = PatientProfileSerializer(profile).data
        except PatientProfile.DoesNotExist:
            user_data['profile'] = None
    elif request.user.role == 'doctor':
        try:
            profile = DoctorProfile.objects.get(user=request.user)
            user_data['profile'] = DoctorProfileSerializer(profile).data
        except DoctorProfile.DoesNotExist:
            user_data['profile'] = None
    
    return Response(user_data)


class PatientProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        # Use different serializer based on user role
        if self.request.user.role == 'patient':
            return PatientProfileForPatientSerializer
        return PatientProfileSerializer

    def get_object(self):
        profile, created = PatientProfile.objects.get_or_create(
            user=self.request.user,
            defaults={
                'gender': 'male',
                'height': 175.0,
                'current_weight': 70.0,
                'activity_level': 'moderate',
                'goal': 'maintain_weight'
            }
        )
        return profile

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


class UserUpdateView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class DoctorPatientProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = PatientProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        patient_id = self.request.query_params.get('patient_id')
        if not patient_id:
            raise serializers.ValidationError("patient_id is required")
        
        # Check if user is doctor or admin
        if self.request.user.role not in ['doctor', 'admin']:
            raise permissions.PermissionDenied("Only doctors can access patient profiles")
        
        try:
            patient = User.objects.get(id=patient_id, role='patient')
            profile, created = PatientProfile.objects.get_or_create(
                user=patient,
                defaults={
                    'gender': 'male',
                    'height': 175.0,
                    'current_weight': 70.0,
                    'activity_level': 'moderate',
                    'goal': 'maintain_weight'
                }
            )
            return profile
        except User.DoesNotExist:
            raise serializers.ValidationError("Patient not found")

    def perform_update(self, serializer):
        # The profile is already linked to the patient user
        serializer.save()

    def retrieve(self, request, *args, **kwargs):
        # Override retrieve to include user data
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        data['user'] = {
            'id': instance.user.id,
            'first_name': instance.user.first_name,
            'last_name': instance.user.last_name,
            'email': getattr(instance.user, 'email', None),
            'phone': instance.user.phone,
            'date_of_birth': instance.user.date_of_birth
        }
        return Response(data)


class DoctorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = DoctorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = DoctorProfile.objects.get_or_create(
            user=self.request.user,
            defaults={
                'license_number': '',
                'specialization': '',
                'years_of_experience': 0,
                'education': '',
                'consultation_fee': 0,
                'available_days': 'Mon,Tue,Wed,Thu,Fri',
                'available_hours_start': '09:00:00',
                'available_hours_end': '17:00:00',
            }
        )
        return profile

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


class PatientMeasurementListCreateView(generics.ListCreateAPIView):
    serializer_class = PatientMeasurementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'patient':
            return PatientMeasurement.objects.filter(patient=self.request.user)
        elif self.request.user.role in ['doctor', 'admin']:
            patient_id = self.request.query_params.get('patient_id')
            if patient_id:
                return PatientMeasurement.objects.filter(patient_id=patient_id)
            return PatientMeasurement.objects.all()
        return PatientMeasurement.objects.none()

    def create(self, request, *args, **kwargs):
        print(f"=== CREATE MEASUREMENT REQUEST ===")
        print(f"User: {request.user.username} (Role: {request.user.role})")
        print(f"Request method: {request.method}")
        print(f"Request data: {request.data}")
        print(f"Request headers: {dict(request.headers)}")
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"Exception in create: {e}")
            import traceback
            traceback.print_exc()
            raise e

    def perform_create(self, serializer):
        print(f"Creating measurement for user: {self.request.user.role}")
        print(f"Request data: {self.request.data}")
        print(f"Validated data: {serializer.validated_data}")
        
        if self.request.user.role == 'patient':
            serializer.save(patient=self.request.user)
        else:
            patient_id = self.request.data.get('patient_id')
            print(f"Patient ID from request: {patient_id}")
            print(f"Patient ID type: {type(patient_id)}")
            
            if patient_id:
                try:
                    # Convert patient_id to integer if it's a string
                    if isinstance(patient_id, str):
                        patient_id = int(patient_id)
                    
                    # Check if patient exists
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    try:
                        patient = User.objects.get(id=patient_id)
                        print(f"Patient found: {patient.username}")
                    except User.DoesNotExist:
                        print(f"Patient with ID {patient_id} does not exist")
                        from rest_framework.exceptions import ValidationError
                        raise ValidationError(f"Patient with ID {patient_id} does not exist")
                    
                    serializer.save(patient_id=patient_id)
                    print("Measurement saved successfully")
                except Exception as e:
                    print(f"Error saving measurement: {e}")
                    import traceback
                    traceback.print_exc()
                    raise e
            else:
                print("No patient_id provided")
                from rest_framework.exceptions import ValidationError
                raise ValidationError("patient_id is required for doctors")


class PatientMeasurementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PatientMeasurementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'patient':
            return PatientMeasurement.objects.filter(patient=self.request.user)
        elif self.request.user.role in ['doctor', 'admin']:
            return PatientMeasurement.objects.all()
        return PatientMeasurement.objects.none()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        # Only allow doctor or admin to delete measurements
        if self.request.user.role in ['doctor', 'admin']:
            instance.delete()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only doctors can delete measurements")


class MedicalDocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicalDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'patient':
            return MedicalDocument.objects.filter(patient=self.request.user)
        elif self.request.user.role in ['doctor', 'admin']:
            patient_id = self.request.query_params.get('patient_id')
            if patient_id:
                return MedicalDocument.objects.filter(patient_id=patient_id)
            return MedicalDocument.objects.all()
        return MedicalDocument.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'patient':
            serializer.save(patient=self.request.user, uploaded_by=self.request.user)
        else:
            patient_id = self.request.data.get('patient_id')
            if patient_id:
                serializer.save(patient_id=patient_id, uploaded_by=self.request.user)


class DoctorListView(generics.ListAPIView):
    serializer_class = DoctorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DoctorProfile.objects.filter(is_approved=True)


class DoctorPatientsView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Debug logging
        print(f"DoctorPatientsView - User: {self.request.user.username} (ID: {self.request.user.id})")
        
        if self.request.user.role == 'doctor':
            # Get patients who have appointments with this doctor (including pending appointments)
            from bookings.models import Appointment
            
            # Get all appointments for this doctor
            all_appointments = Appointment.objects.filter(doctor=self.request.user)
            print(f"DoctorPatientsView - Found {all_appointments.count()} appointments for doctor")
            
            patient_ids = all_appointments.values_list('patient', flat=True).distinct()
            patients = User.objects.filter(id__in=patient_ids, role='patient').order_by('-id')
            
            print(f"DoctorPatientsView - Returning {patients.count()} patients")
            return patients
        elif self.request.user.role == 'admin':
            return User.objects.filter(role='patient').order_by('-id')
        return User.objects.none()
