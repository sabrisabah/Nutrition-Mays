from django.core.management.base import BaseCommand
from meal_plans.models import MealType

class Command(BaseCommand):
    help = 'Setup basic meal types for the system'

    def handle(self, *args, **options):
        # أنواع الوجبات الأساسية
        meal_types = [
            {
                'name': 'Breakfast',
                'name_ar': 'الفطور',
                'order': 1
            },
            {
                'name': 'Morning Snack',
                'name_ar': 'وجبة خفيفة صباحية',
                'order': 2
            },
            {
                'name': 'Lunch',
                'name_ar': 'الغداء',
                'order': 3
            },
            {
                'name': 'Afternoon Snack',
                'name_ar': 'وجبة خفيفة بعد الظهر',
                'order': 4
            },
            {
                'name': 'Dinner',
                'name_ar': 'العشاء',
                'order': 5
            },
            {
                'name': 'Evening Snack',
                'name_ar': 'وجبة خفيفة مسائية',
                'order': 6
            },
            {
                'name': 'Pre-Workout',
                'name_ar': 'قبل التمرين',
                'order': 7
            },
            {
                'name': 'Post-Workout',
                'name_ar': 'بعد التمرين',
                'order': 8
            }
        ]
        
        for meal_type_data in meal_types:
            meal_type, created = MealType.objects.get_or_create(
                name=meal_type_data['name'],
                defaults={
                    'name_ar': meal_type_data['name_ar'],
                    'order': meal_type_data['order']
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created meal type: {meal_type.name} ({meal_type.name_ar})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Meal type already exists: {meal_type.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully setup meal types')
        )