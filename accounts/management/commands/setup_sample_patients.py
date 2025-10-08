from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import PatientProfile

User = get_user_model()

class Command(BaseCommand):
    help = 'Setup sample patients for testing meal plans'

    def handle(self, *args, **options):
        # Create sample patients if they don't exist
        sample_patients = [
            {
                'username': 'ahmed_patient',
                'first_name': 'أحمد',
                'last_name': 'محمد',
                'email': 'ahmed.patient@example.com',
                'password': 'testpass123',
                'phone': '+9647501234567',
                'date_of_birth': '1990-05-15',
                'gender': 'male',
                'height': 175,
                'weight': 80,
                'goal': 'weight_loss',
                'medical_conditions': 'لا توجد'
            },
            {
                'username': 'fatima_patient',
                'first_name': 'فاطمة',
                'last_name': 'علي',
                'email': 'fatima.patient@example.com',
                'password': 'testpass123',
                'phone': '+9647501234568',
                'date_of_birth': '1988-08-22',
                'gender': 'female',
                'height': 160,
                'weight': 65,
                'goal': 'maintenance',
                'medical_conditions': 'لا توجد'
            },
            {
                'username': 'mohammed_patient',
                'first_name': 'محمد',
                'last_name': 'حسن',
                'email': 'mohammed.patient@example.com',
                'password': 'testpass123',
                'phone': '+9647501234569',
                'date_of_birth': '1992-12-10',
                'gender': 'male',
                'height': 180,
                'weight': 75,
                'goal': 'muscle_gain',
                'medical_conditions': 'لا توجد'
            }
        ]
        
        for patient_data in sample_patients:
            try:
                # Check if user exists
                user, created = User.objects.get_or_create(
                    username=patient_data['username'],
                    defaults={
                        'first_name': patient_data['first_name'],
                        'last_name': patient_data['last_name'],
                        'email': patient_data['email'],
                        'role': 'patient'
                    }
                )
                
                if created:
                    user.set_password(patient_data['password'])
                    user.save()
                    
                    # Create patient profile
                    profile, profile_created = PatientProfile.objects.get_or_create(
                        user=user,
                        defaults={
                            'phone': patient_data['phone'],
                            'date_of_birth': patient_data['date_of_birth'],
                            'gender': patient_data['gender'],
                            'height': patient_data['height'],
                            'weight': patient_data['weight'],
                            'goal': patient_data['goal'],
                            'medical_conditions': patient_data['medical_conditions']
                        }
                    )
                    
                    if profile_created:
                        self.stdout.write(
                            self.style.SUCCESS(f'Created patient: {user.get_full_name()}')
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'Patient profile already exists: {user.get_full_name()}')
                        )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Patient already exists: {user.get_full_name()}')
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error creating patient {patient_data["username"]}: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully setup sample patients')
        )
