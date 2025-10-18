"""
إنشاء تقرير غذائي عراقي شامل
Generate Comprehensive Iraqi Nutrition Report
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q
from meal_plans.models import Food, MealPlan, Meal, Recipe
from meal_plans.nutrition_calculator import IraqiNutritionCalculator
import json


class Command(BaseCommand):
    help = 'إنشاء تقرير غذائي عراقي شامل'

    def add_arguments(self, parser):
        parser.add_argument(
            '--meal-plan-id',
            type=int,
            help='معرف خطة الوجبات (اختياري)'
        )
        parser.add_argument(
            '--output-file',
            type=str,
            default='iraqi_nutrition_report.json',
            help='اسم ملف التقرير (افتراضي: iraqi_nutrition_report.json)'
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['json', 'text'],
            default='json',
            help='تنسيق التقرير (json أو text)'
        )

    def handle(self, *args, **options):
        self.stdout.write('بدء إنشاء التقرير الغذائي العراقي...')
        
        calculator = IraqiNutritionCalculator()
        report_data = {
            'report_info': {
                'title': 'التقرير الغذائي العراقي الشامل',
                'generated_at': timezone.now().isoformat(),
                'language': 'العربية العراقية',
                'version': '1.0'
            },
            'summary': {},
            'foods_analysis': {},
            'meal_plans_analysis': {},
            'recommendations': {}
        }
        
        # تحليل الأطعمة العراقية
        self.stdout.write('تحليل الأطعمة العراقية...')
        iraqi_foods = Food.objects.filter(
            Q(name_ar__icontains='عراقي') | 
            Q(name__icontains='iraqi') |
            Q(description__icontains='عراقي')
        ).filter(is_active=True)
        
        foods_analysis = {
            'total_foods': iraqi_foods.count(),
            'categories': {},
            'nutrition_summary': {
                'calories': {'min': 0, 'max': 0, 'avg': 0},
                'protein': {'min': 0, 'max': 0, 'avg': 0},
                'carbs': {'min': 0, 'max': 0, 'avg': 0},
                'fat': {'min': 0, 'max': 0, 'avg': 0}
            },
            'top_foods': {
                'highest_calories': [],
                'highest_protein': [],
                'highest_fiber': [],
                'lowest_calories': []
            }
        }
        
        if iraqi_foods.exists():
            # تحليل الفئات
            for food in iraqi_foods:
                category_name = food.category.name_ar or food.category.name
                if category_name not in foods_analysis['categories']:
                    foods_analysis['categories'][category_name] = 0
                foods_analysis['categories'][category_name] += 1
            
            # تحليل القيم الغذائية
            calories_list = [f.calories_per_100g for f in iraqi_foods]
            protein_list = [f.protein_per_100g for f in iraqi_foods]
            carbs_list = [f.carbs_per_100g for f in iraqi_foods]
            fat_list = [f.fat_per_100g for f in iraqi_foods]
            
            foods_analysis['nutrition_summary']['calories'] = {
                'min': min(calories_list),
                'max': max(calories_list),
                'avg': sum(calories_list) / len(calories_list)
            }
            foods_analysis['nutrition_summary']['protein'] = {
                'min': min(protein_list),
                'max': max(protein_list),
                'avg': sum(protein_list) / len(protein_list)
            }
            foods_analysis['nutrition_summary']['carbs'] = {
                'min': min(carbs_list),
                'max': max(carbs_list),
                'avg': sum(carbs_list) / len(carbs_list)
            }
            foods_analysis['nutrition_summary']['fat'] = {
                'min': min(fat_list),
                'max': max(fat_list),
                'avg': sum(fat_list) / len(fat_list)
            }
            
            # أفضل الأطعمة
            foods_analysis['top_foods']['highest_calories'] = [
                {
                    'name': f.name_ar or f.name,
                    'calories': f.calories_per_100g
                }
                for f in sorted(iraqi_foods, key=lambda x: x.calories_per_100g, reverse=True)[:5]
            ]
            
            foods_analysis['top_foods']['highest_protein'] = [
                {
                    'name': f.name_ar or f.name,
                    'protein': f.protein_per_100g
                }
                for f in sorted(iraqi_foods, key=lambda x: x.protein_per_100g, reverse=True)[:5]
            ]
            
            foods_analysis['top_foods']['highest_fiber'] = [
                {
                    'name': f.name_ar or f.name,
                    'fiber': f.fiber_per_100g
                }
                for f in sorted(iraqi_foods, key=lambda x: x.fiber_per_100g, reverse=True)[:5]
            ]
            
            foods_analysis['top_foods']['lowest_calories'] = [
                {
                    'name': f.name_ar or f.name,
                    'calories': f.calories_per_100g
                }
                for f in sorted(iraqi_foods, key=lambda x: x.calories_per_100g)[:5]
            ]
        
        report_data['foods_analysis'] = foods_analysis
        
        # تحليل خطط الوجبات العراقية
        self.stdout.write('تحليل خطط الوجبات العراقية...')
        iraqi_meal_plans = MealPlan.objects.filter(
            Q(title__icontains='عراقي') | 
            Q(description__icontains='عراقي')
        )
        
        meal_plans_analysis = {
            'total_plans': iraqi_meal_plans.count(),
            'active_plans': iraqi_meal_plans.filter(status='active').count(),
            'completed_plans': iraqi_meal_plans.filter(status='completed').count(),
            'plans_details': []
        }
        
        for plan in iraqi_meal_plans:
            try:
                plan_nutrition = calculator.calculate_daily_plan_nutrition(plan)
                meal_plans_analysis['plans_details'].append({
                    'id': plan.id,
                    'title': plan.title,
                    'status': plan.get_status_display(),
                    'total_nutrition': plan_nutrition['total_nutrition'],
                    'meals_count': plan_nutrition['meals_count'],
                    'diet_plan': plan.diet_plan
                })
            except Exception as e:
                self.stdout.write(f'خطأ في تحليل خطة {plan.title}: {str(e)}')
        
        report_data['meal_plans_analysis'] = meal_plans_analysis
        
        # التوصيات الغذائية العراقية
        recommendations = {
            'general_recommendations': [
                'تناول الأرز العراقي باعتدال لاحتوائه على كربوهيدرات عالية',
                'الكباب العراقي مصدر ممتاز للبروتين',
                'الدولمة العراقية غنية بالألياف والفيتامينات',
                'تجنب الإفراط في الحلويات العراقية لاحتوائها على سكر عالي',
                'الشاي العراقي منخفض السعرات ويمكن تناوله بانتظام'
            ],
            'nutritional_balance': [
                'دمج البروتين من الكباب والمنسف مع الكربوهيدرات من الأرز',
                'تناول الخضروات في الدولمة لتحقيق التوازن الغذائي',
                'استخدام الجبن العراقي كمصدر للكالسيوم',
                'التمر العراقي مصدر طبيعي للسكر والألياف'
            ],
            'health_considerations': [
                'مراقبة الصوديوم في الأطعمة المملحة مثل الباجة',
                'تناول المقلوبة باعتدال لاحتوائها على دهون',
                'الاعتماد على اللبن العراقي للبروبيوتيك',
                'تجنب الإفراط في البقلاوة والكنافة'
            ]
        }
        
        report_data['recommendations'] = recommendations
        
        # ملخص التقرير
        summary = {
            'total_iraqi_foods': foods_analysis['total_foods'],
            'total_meal_plans': meal_plans_analysis['total_plans'],
            'categories_count': len(foods_analysis['categories']),
            'avg_calories_per_100g': round(foods_analysis['nutrition_summary']['calories']['avg'], 2),
            'avg_protein_per_100g': round(foods_analysis['nutrition_summary']['protein']['avg'], 2),
            'report_generated_at': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        report_data['summary'] = summary
        
        # حفظ التقرير
        output_file = options['output_file']
        format_type = options['format']
        
        if format_type == 'json':
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, ensure_ascii=False, indent=2)
        else:
            # تنسيق نصي
            text_report = self._generate_text_report(report_data)
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(text_report)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'تم إنشاء التقرير الغذائي العراقي بنجاح: {output_file}'
            )
        )
        
        # عرض ملخص سريع
        self.stdout.write('\n=== ملخص التقرير ===')
        self.stdout.write(f'إجمالي الأطعمة العراقية: {summary["total_iraqi_foods"]}')
        self.stdout.write(f'إجمالي خطط الوجبات: {summary["total_meal_plans"]}')
        self.stdout.write(f'عدد الفئات: {summary["categories_count"]}')
        self.stdout.write(f'متوسط السعرات لكل 100 جرام: {summary["avg_calories_per_100g"]}')
        self.stdout.write(f'متوسط البروتين لكل 100 جرام: {summary["avg_protein_per_100g"]}')

    def _generate_text_report(self, report_data):
        """إنشاء تقرير نصي"""
        text = f"""
التقرير الغذائي العراقي الشامل
================================

معلومات التقرير:
- العنوان: {report_data['report_info']['title']}
- تاريخ الإنشاء: {report_data['report_info']['generated_at']}
- اللغة: {report_data['report_info']['language']}

ملخص التقرير:
=============
- إجمالي الأطعمة العراقية: {report_data['summary']['total_iraqi_foods']}
- إجمالي خطط الوجبات: {report_data['summary']['total_meal_plans']}
- عدد الفئات: {report_data['summary']['categories_count']}
- متوسط السعرات لكل 100 جرام: {report_data['summary']['avg_calories_per_100g']}
- متوسط البروتين لكل 100 جرام: {report_data['summary']['avg_protein_per_100g']}

تحليل الأطعمة:
==============
إجمالي الأطعمة: {report_data['foods_analysis']['total_foods']}

الفئات:
"""
        
        for category, count in report_data['foods_analysis']['categories'].items():
            text += f"- {category}: {count} طعام\n"
        
        text += f"""
القيم الغذائية:
- السعرات: {report_data['foods_analysis']['nutrition_summary']['calories']['min']} - {report_data['foods_analysis']['nutrition_summary']['calories']['max']} (متوسط: {report_data['foods_analysis']['nutrition_summary']['calories']['avg']:.2f})
- البروتين: {report_data['foods_analysis']['nutrition_summary']['protein']['min']} - {report_data['foods_analysis']['nutrition_summary']['protein']['max']} (متوسط: {report_data['foods_analysis']['nutrition_summary']['protein']['avg']:.2f})
- الكربوهيدرات: {report_data['foods_analysis']['nutrition_summary']['carbs']['min']} - {report_data['foods_analysis']['nutrition_summary']['carbs']['max']} (متوسط: {report_data['foods_analysis']['nutrition_summary']['carbs']['avg']:.2f})
- الدهون: {report_data['foods_analysis']['nutrition_summary']['fat']['min']} - {report_data['foods_analysis']['nutrition_summary']['fat']['max']} (متوسط: {report_data['foods_analysis']['nutrition_summary']['fat']['avg']:.2f})

أعلى الأطعمة في السعرات:
"""
        
        for food in report_data['foods_analysis']['top_foods']['highest_calories']:
            text += f"- {food['name']}: {food['calories']} سعرة حرارية\n"
        
        text += """
أعلى الأطعمة في البروتين:
"""
        
        for food in report_data['foods_analysis']['top_foods']['highest_protein']:
            text += f"- {food['name']}: {food['protein']} جرام\n"
        
        text += """
التوصيات العامة:
===============
"""
        
        for rec in report_data['recommendations']['general_recommendations']:
            text += f"- {rec}\n"
        
        text += """
التوازن الغذائي:
===============
"""
        
        for rec in report_data['recommendations']['nutritional_balance']:
            text += f"- {rec}\n"
        
        text += """
اعتبارات صحية:
=============
"""
        
        for rec in report_data['recommendations']['health_considerations']:
            text += f"- {rec}\n"
        
        return text
