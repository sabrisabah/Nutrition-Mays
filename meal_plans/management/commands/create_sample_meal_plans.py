from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from meal_plans.models import MealPlan, Meal, MealType
from datetime import date, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample meal plans for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample meal plans...')
        
        # Get or create a patient user
        patient, created = User.objects.get_or_create(
            username='patient_test',
            defaults={
                'email': 'patient@test.com',
                'first_name': 'أحمد',
                'last_name': 'محمد',
                'role': 'patient',
                'is_active': True
            }
        )
        
        if created:
            patient.set_password('test123')
            patient.save()
            self.stdout.write(f'✅ Created patient user: {patient.username}')
        else:
            self.stdout.write(f'✅ Using existing patient user: {patient.username}')
        
        # Get or create a doctor user
        doctor, created = User.objects.get_or_create(
            username='doctor_test',
            defaults={
                'email': 'doctor@test.com',
                'first_name': 'د. فاطمة',
                'last_name': 'علي',
                'role': 'doctor',
                'is_active': True
            }
        )
        
        if created:
            doctor.set_password('test123')
            doctor.save()
            self.stdout.write(f'✅ Created doctor user: {doctor.username}')
        else:
            self.stdout.write(f'✅ Using existing doctor user: {doctor.username}')
        
        # Get meal types
        breakfast, _ = MealType.objects.get_or_create(name='breakfast', defaults={'name_ar': 'الإفطار'})
        lunch, _ = MealType.objects.get_or_create(name='lunch', defaults={'name_ar': 'الغداء'})
        dinner, _ = MealType.objects.get_or_create(name='dinner', defaults={'name_ar': 'العشاء'})
        snack, _ = MealType.objects.get_or_create(name='snack', defaults={'name_ar': 'وجبة خفيفة'})
        
        # Create sample meal plan
        start_date = date.today()
        end_date = start_date + timedelta(days=7)
        
        meal_plan, created = MealPlan.objects.get_or_create(
            title='خطة إنقاص الوزن - المرحلة الأولى',
            patient=patient,
            doctor=doctor,
            defaults={
                'description': 'خطة غذائية متوازنة لإنقاص الوزن بشكل صحي',
                'start_date': start_date,
                'end_date': end_date,
                'target_calories': 1800,
                'target_protein': 120,
                'target_carbs': 200,
                'target_fat': 60,
                'notes': 'خطة تجريبية للمريض',
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(f'✅ Created meal plan: {meal_plan.title}')
            
            # Create sample meals
            meals_data = [
                {
                    'meal_type': breakfast,
                    'day_of_week': 0,  # Monday
                    'name': 'سلطة الفواكه مع الزبادي',
                    'description': 'سلطة فواكه طازجة مع زبادي يوناني',
                    'instructions': 'امزج الفواكه مع الزبادي واتركها لمدة 10 دقائق',
                    'prep_time': 10
                },
                {
                    'meal_type': lunch,
                    'day_of_week': 0,  # Monday
                    'name': 'صدر دجاج مشوي مع الأرز البني',
                    'description': 'صدر دجاج مشوي مع أرز بني وخضروات',
                    'instructions': 'اشوي الدجاج لمدة 20 دقيقة واطبخ الأرز لمدة 30 دقيقة',
                    'prep_time': 45
                },
                {
                    'meal_type': dinner,
                    'day_of_week': 0,  # Monday
                    'name': 'سمك السلمون مع البطاطس الحلوة',
                    'description': 'سمك سلمون مشوي مع بطاطس حلوة',
                    'instructions': 'اشوي السلمون لمدة 15 دقيقة واخبز البطاطس لمدة 25 دقيقة',
                    'prep_time': 40
                },
                {
                    'meal_type': snack,
                    'day_of_week': 0,  # Monday
                    'name': 'المكسرات والزبيب',
                    'description': 'مزيج من المكسرات والزبيب',
                    'instructions': 'امزج المكسرات مع الزبيب',
                    'prep_time': 2
                }
            ]
            
            for meal_data in meals_data:
                meal = Meal.objects.create(
                    meal_plan=meal_plan,
                    **meal_data
                )
                self.stdout.write(f'  ✅ Created meal: {meal.name}')
        else:
            self.stdout.write(f'✅ Using existing meal plan: {meal_plan.title}')
        
        # Create another meal plan (upcoming)
        upcoming_start = start_date + timedelta(days=8)
        upcoming_end = upcoming_start + timedelta(days=14)
        
        upcoming_plan, created = MealPlan.objects.get_or_create(
            title='خطة بناء العضلات',
            patient=patient,
            doctor=doctor,
            defaults={
                'description': 'خطة غذائية عالية البروتين لبناء العضلات',
                'start_date': upcoming_start,
                'end_date': upcoming_end,
                'target_calories': 2200,
                'target_protein': 150,
                'target_carbs': 250,
                'target_fat': 70,
                'notes': 'خطة قادمة لبناء العضلات',
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(f'✅ Created upcoming meal plan: {upcoming_plan.title}')
        else:
            self.stdout.write(f'✅ Using existing upcoming meal plan: {upcoming_plan.title}')
        
        # Create a completed meal plan
        completed_start = start_date - timedelta(days=30)
        completed_end = start_date - timedelta(days=23)
        
        completed_plan, created = MealPlan.objects.get_or_create(
            title='خطة تنظيف الجسم',
            patient=patient,
            doctor=doctor,
            defaults={
                'description': 'خطة غذائية لتنظيف الجسم من السموم',
                'start_date': completed_start,
                'end_date': completed_end,
                'target_calories': 1600,
                'target_protein': 100,
                'target_carbs': 180,
                'target_fat': 50,
                'notes': 'خطة مكتملة لتنظيف الجسم',
                'is_active': False
            }
        )
        
        if created:
            self.stdout.write(f'✅ Created completed meal plan: {completed_plan.title}')
        else:
            self.stdout.write(f'✅ Using existing completed meal plan: {completed_plan.title}')
        
        self.stdout.write(self.style.SUCCESS('✅ Sample meal plans created successfully!'))
        self.stdout.write(f'📊 Summary:')
        self.stdout.write(f'  - Patient: {patient.username} (ID: {patient.id})')
        self.stdout.write(f'  - Doctor: {doctor.username} (ID: {doctor.id})')
        self.stdout.write(f'  - Total meal plans: {MealPlan.objects.filter(patient=patient).count()}')
        self.stdout.write(f'  - Total meals: {Meal.objects.filter(meal_plan__patient=patient).count()}')
        
        # Test credentials
        self.stdout.write(f'🔑 Test Credentials:')
        self.stdout.write(f'  - Patient: {patient.username} / test123')
        self.stdout.write(f'  - Doctor: {doctor.username} / test123')
