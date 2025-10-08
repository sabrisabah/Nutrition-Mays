from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import DoctorProfile

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample doctors for testing'

    def handle(self, *args, **options):
        # Create sample doctors
        doctors_data = [
            {
                'username': 'dr_ahmed_nutrition',
                'email': 'dr.ahmed@demo.com',
                'first_name': 'أحمد',
                'last_name': 'محمد',
                'phone': '+964770123456',
                'role': 'doctor',
                'specialization': 'nutrition',
                'years_of_experience': 8,
                'consultation_fee': 50000,
                'education': 'دكتوراه في التغذية العلاجية - جامعة بغداد',
                'certifications': 'شهادة أخصائي تغذية معتمد - الجمعية الأمريكية للتغذية',
                'bio': 'أخصائي تغذية علاجية مع خبرة 8 سنوات في علاج السمنة والسكري وأمراض القلب',
                'is_approved': True
            },
            {
                'username': 'dr_fatima_general',
                'email': 'dr.fatima@demo.com',
                'first_name': 'فاطمة',
                'last_name': 'علي',
                'phone': '+964770234567',
                'role': 'doctor',
                'specialization': 'general',
                'years_of_experience': 5,
                'consultation_fee': 40000,
                'education': 'ماجستير في الطب العام - جامعة الموصل',
                'certifications': 'شهادة طب عام - وزارة الصحة العراقية',
                'bio': 'طبيبة عامة مع خبرة في التشخيص والعلاج العام',
                'is_approved': True
            },
            {
                'username': 'dr_omar_specialist',
                'email': 'dr.omar@demo.com',
                'first_name': 'عمر',
                'last_name': 'حسن',
                'phone': '+964770345678',
                'role': 'doctor',
                'specialization': 'specialist',
                'years_of_experience': 12,
                'consultation_fee': 60000,
                'education': 'دكتوراه في الطب الباطني - جامعة البصرة',
                'certifications': 'شهادة أخصائي أمراض باطنية - المجلس الطبي العراقي',
                'bio': 'أخصائي أمراض باطنية مع خبرة واسعة في علاج الأمراض المزمنة',
                'is_approved': True
            }
        ]

        created_count = 0
        for doctor_data in doctors_data:
            # Create user
            user, created = User.objects.get_or_create(
                username=doctor_data['username'],
                defaults={
                    'email': doctor_data['email'],
                    'first_name': doctor_data['first_name'],
                    'last_name': doctor_data['last_name'],
                    'phone': doctor_data['phone'],
                    'role': doctor_data['role']
                }
            )
            
            if created:
                user.set_password('test123')
                user.save()
                
                # Create doctor profile
                DoctorProfile.objects.create(
                    user=user,
                    license_number=f'DOC{user.id:03d}',
                    specialization=doctor_data['specialization'],
                    years_of_experience=doctor_data['years_of_experience'],
                    education=doctor_data['education'],
                    consultation_fee=doctor_data['consultation_fee'],
                    available_days='Mon,Tue,Wed,Thu,Fri',
                    available_hours_start='09:00:00',
                    available_hours_end='17:00:00',
                    certifications=doctor_data['certifications'],
                    bio=doctor_data['bio'],
                    is_approved=doctor_data['is_approved']
                )
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created doctor: {doctor_data["first_name"]} {doctor_data["last_name"]}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Doctor already exists: {doctor_data["first_name"]} {doctor_data["last_name"]}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} sample doctors')
        )
