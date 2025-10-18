from django.core.management.base import BaseCommand
from meal_plans.models import MealPlanTemplate


class Command(BaseCommand):
    help = 'تحديث أوصاف قوالب الوجبات باللغة العربية'

    def handle(self, *args, **options):
        # قوالب الوجبات مع الأوصاف العربية
        templates_data = [
            {
                'name': 'Balanced Diet Plan',
                'description_ar': 'نظام غذائي متوازن مع التركيز على جميع العناصر الغذائية الأساسية للصحة العامة والحفاظ على الوزن'
            },
            {
                'name': 'High Protein Plan',
                'description_ar': 'نظام غذائي عالي البروتين لبناء العضلات وإنقاص الوزن مع الحفاظ على الكتلة العضلية'
            },
            {
                'name': 'Ketogenic Diet',
                'description_ar': 'نظام غذائي منخفض الكربوهيدرات وعالي الدهون لإنقاص الوزن السريع وتحسين التمثيل الغذائي'
            },
            {
                'name': 'Mediterranean Diet',
                'description_ar': 'نظام غذائي متوسطي غني بالدهون الصحية والأسماك والخضروات للحفاظ على صحة القلب'
            },
            {
                'name': 'Low Carb Plan',
                'description_ar': 'نظام غذائي منخفض الكربوهيدرات لإنقاص الوزن والتحكم في مستويات السكر في الدم'
            },
            {
                'name': 'Vegetarian Plan',
                'description_ar': 'نظام غذائي نباتي مع التركيز على البروتينات النباتية والخضروات والفواكه'
            },
            {
                'name': 'Vegan Plan',
                'description_ar': 'نظام غذائي نباتي صرف مع التركيز على التغذية النباتية الكاملة والمتوازنة'
            },
            {
                'name': 'Keto Diet Plan',
                'description_ar': 'نظام غذائي عالي الدهون ومنخفض الكربوهيدرات لتحفيز الكيتوزيس وإنقاص الوزن'
            },
            {
                'name': 'Weight Loss Plan',
                'description_ar': 'نظام غذائي منخفض السعرات الحرارية لإنقاص الوزن بطريقة صحية ومستدامة'
            },
            {
                'name': 'Mediterranean Plan',
                'description_ar': 'نظام غذائي متوسطي متوازن مع التركيز على زيت الزيتون والأسماك والخضروات الطازجة'
            }
        ]

        updated_count = 0
        
        for template_data in templates_data:
            try:
                template = MealPlanTemplate.objects.get(name=template_data['name'])
                template.description = template_data['description_ar']
                template.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'تم تحديث: {template.name}')
                )
            except MealPlanTemplate.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'لم يتم العثور على: {template_data["name"]}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'خطأ في تحديث {template_data["name"]}: {e}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'تم تحديث {updated_count} قالب وجبات بنجاح')
        )
