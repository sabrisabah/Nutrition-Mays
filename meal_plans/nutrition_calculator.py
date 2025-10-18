"""
حاسبة القيم الغذائية العراقية المتقدمة
Iraqi Advanced Nutrition Calculator
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any, Optional
from django.db.models import Q
from .models import Food, Meal, Recipe, MealPlan, MealIngredient, RecipeIngredient


class IraqiNutritionCalculator:
    """حاسبة القيم الغذائية العراقية المتقدمة"""
    
    def __init__(self):
        self.nutrition_fields = [
            'calories', 'protein', 'carbs', 'fat', 'fiber', 
            'sugar', 'sodium', 'vitamin_a', 'vitamin_c', 'vitamin_d', 
            'calcium', 'iron'
        ]
        
        # أسماء القيم الغذائية بالعربية العراقية
        self.arabic_names = {
            'calories': 'السعرات الحرارية',
            'protein': 'البروتين',
            'carbs': 'الكربوهيدرات',
            'fat': 'الدهون',
            'fiber': 'الألياف',
            'sugar': 'السكر',
            'sodium': 'الصوديوم',
            'vitamin_a': 'فيتامين أ',
            'vitamin_c': 'فيتامين ج',
            'vitamin_d': 'فيتامين د',
            'calcium': 'الكالسيوم',
            'iron': 'الحديد'
        }
        
        # وحدات القياس بالعربية
        self.units = {
            'calories': 'سعرة حرارية',
            'protein': 'جرام',
            'carbs': 'جرام',
            'fat': 'جرام',
            'fiber': 'جرام',
            'sugar': 'جرام',
            'sodium': 'ملليجرام',
            'vitamin_a': 'ميكروجرام',
            'vitamin_c': 'ملليجرام',
            'vitamin_d': 'ميكروجرام',
            'calcium': 'ملليجرام',
            'iron': 'ملليجرام'
        }

    def calculate_food_nutrition(self, food: Food, amount_grams: float) -> Dict[str, float]:
        """حساب القيم الغذائية لمادة غذائية معينة"""
        factor = amount_grams / 100.0
        
        nutrition = {}
        for field in self.nutrition_fields:
            value = getattr(food, f'{field}_per_100g', 0) * factor
            nutrition[field] = round(float(value), 2)
        
        return nutrition

    def calculate_meal_nutrition(self, meal: Meal) -> Dict[str, Any]:
        """حساب القيم الغذائية لوجبة كاملة"""
        total_nutrition = {field: 0.0 for field in self.nutrition_fields}
        ingredients_detail = []
        
        for ingredient in meal.ingredients.all():
            ingredient_nutrition = self.calculate_food_nutrition(
                ingredient.food, 
                ingredient.amount
            )
            
            # إضافة للقيم الإجمالية
            for field in self.nutrition_fields:
                total_nutrition[field] += ingredient_nutrition[field]
            
            # تفاصيل المكون
            ingredients_detail.append({
                'food_name': ingredient.food.name_ar or ingredient.food.name,
                'food_name_en': ingredient.food.name,
                'amount_grams': ingredient.amount,
                'amount_description': f"{ingredient.amount} جرام",
                'notes': ingredient.notes,
                'nutrition': ingredient_nutrition,
                'nutrition_arabic': self._format_nutrition_arabic(ingredient_nutrition)
            })
        
        # تقريب القيم
        for field in self.nutrition_fields:
            total_nutrition[field] = round(total_nutrition[field], 2)
        
        return {
            'meal_name': meal.name,
            'meal_description': meal.description,
            'total_nutrition': total_nutrition,
            'total_nutrition_arabic': self._format_nutrition_arabic(total_nutrition),
            'ingredients_count': len(ingredients_detail),
            'ingredients_detail': ingredients_detail,
            'prep_time': meal.prep_time,
            'instructions': meal.instructions
        }

    def calculate_recipe_nutrition(self, recipe: Recipe) -> Dict[str, Any]:
        """حساب القيم الغذائية لوصفة كاملة"""
        total_nutrition = {field: 0.0 for field in self.nutrition_fields}
        ingredients_detail = []
        
        for ingredient in recipe.ingredients.all():
            ingredient_nutrition = self.calculate_food_nutrition(
                ingredient.food, 
                ingredient.amount
            )
            
            # إضافة للقيم الإجمالية
            for field in self.nutrition_fields:
                total_nutrition[field] += ingredient_nutrition[field]
            
            # تفاصيل المكون
            ingredients_detail.append({
                'food_name': ingredient.food.name_ar or ingredient.food.name,
                'food_name_en': ingredient.food.name,
                'amount_grams': ingredient.amount,
                'amount_description': f"{ingredient.amount} جرام",
                'notes': ingredient.notes,
                'nutrition': ingredient_nutrition,
                'nutrition_arabic': self._format_nutrition_arabic(ingredient_nutrition)
            })
        
        # تقريب القيم
        for field in self.nutrition_fields:
            total_nutrition[field] = round(total_nutrition[field], 2)
        
        # حساب القيم لكل حصة
        servings = recipe.servings or 1
        nutrition_per_serving = {}
        for field in self.nutrition_fields:
            nutrition_per_serving[field] = round(total_nutrition[field] / servings, 2)
        
        return {
            'recipe_name': recipe.name_ar or recipe.name,
            'recipe_name_en': recipe.name,
            'recipe_description': recipe.description,
            'servings': servings,
            'total_nutrition': total_nutrition,
            'total_nutrition_arabic': self._format_nutrition_arabic(total_nutrition),
            'nutrition_per_serving': nutrition_per_serving,
            'nutrition_per_serving_arabic': self._format_nutrition_arabic(nutrition_per_serving),
            'ingredients_count': len(ingredients_detail),
            'ingredients_detail': ingredients_detail,
            'prep_time': recipe.prep_time,
            'cook_time': recipe.cook_time,
            'total_time': recipe.prep_time + recipe.cook_time,
            'difficulty_level': recipe.get_difficulty_level_display(),
            'instructions': recipe.instructions
        }

    def calculate_daily_plan_nutrition(self, meal_plan: MealPlan) -> Dict[str, Any]:
        """حساب القيم الغذائية للخطة اليومية الكاملة"""
        total_nutrition = {field: 0.0 for field in self.nutrition_fields}
        meals_detail = []
        
        for meal in meal_plan.meals.all():
            meal_nutrition = self.calculate_meal_nutrition(meal)
            
            # إضافة للقيم الإجمالية
            for field in self.nutrition_fields:
                total_nutrition[field] += meal_nutrition['total_nutrition'][field]
            
            meals_detail.append(meal_nutrition)
        
        # تقريب القيم
        for field in self.nutrition_fields:
            total_nutrition[field] = round(total_nutrition[field], 2)
        
        # مقارنة مع الأهداف
        targets = {
            'calories': meal_plan.target_calories,
            'protein': meal_plan.target_protein,
            'carbs': meal_plan.target_carbs,
            'fat': meal_plan.target_fat
        }
        
        comparison = self._compare_with_targets(total_nutrition, targets)
        
        return {
            'plan_title': meal_plan.title,
            'plan_description': meal_plan.description,
            'plan_duration': f"من {meal_plan.start_date} إلى {meal_plan.end_date}",
            'total_nutrition': total_nutrition,
            'total_nutrition_arabic': self._format_nutrition_arabic(total_nutrition),
            'targets': targets,
            'targets_arabic': self._format_nutrition_arabic(targets),
            'comparison': comparison,
            'meals_count': len(meals_detail),
            'meals_detail': meals_detail,
            'diet_plan': meal_plan.diet_plan,
            'status': meal_plan.get_status_display()
        }

    def calculate_custom_nutrition(self, foods_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """حساب القيم الغذائية لقائمة مخصصة من الأطعمة"""
        total_nutrition = {field: 0.0 for field in self.nutrition_fields}
        foods_detail = []
        
        for item in foods_data:
            food_id = item.get('food_id')
            amount = float(item.get('amount', 0))
            
            try:
                food = Food.objects.get(id=food_id, is_active=True)
                food_nutrition = self.calculate_food_nutrition(food, amount)
                
                # إضافة للقيم الإجمالية
                for field in self.nutrition_fields:
                    total_nutrition[field] += food_nutrition[field]
                
                foods_detail.append({
                    'food_name': food.name_ar or food.name,
                    'food_name_en': food.name,
                    'food_category': food.category.name_ar or food.category.name,
                    'amount_grams': amount,
                    'amount_description': f"{amount} جرام",
                    'nutrition': food_nutrition,
                    'nutrition_arabic': self._format_nutrition_arabic(food_nutrition)
                })
                
            except Food.DoesNotExist:
                continue
        
        # تقريب القيم
        for field in self.nutrition_fields:
            total_nutrition[field] = round(total_nutrition[field], 2)
        
        return {
            'total_nutrition': total_nutrition,
            'total_nutrition_arabic': self._format_nutrition_arabic(total_nutrition),
            'foods_count': len(foods_detail),
            'foods_detail': foods_detail
        }

    def _format_nutrition_arabic(self, nutrition: Dict[str, float]) -> Dict[str, str]:
        """تنسيق القيم الغذائية بالعربية العراقية"""
        formatted = {}
        
        for field, value in nutrition.items():
            if field in self.arabic_names and field in self.units:
                arabic_name = self.arabic_names[field]
                unit = self.units[field]
                formatted[field] = f"{arabic_name}: {value} {unit}"
        
        return formatted

    def _compare_with_targets(self, actual: Dict[str, float], targets: Dict[str, float]) -> Dict[str, Any]:
        """مقارنة القيم الفعلية مع الأهداف"""
        comparison = {}
        
        for field in ['calories', 'protein', 'carbs', 'fat']:
            if field in actual and field in targets:
                actual_val = actual[field]
                target_val = targets[field]
                
                if target_val > 0:
                    percentage = (actual_val / target_val) * 100
                    difference = actual_val - target_val
                    
                    if percentage >= 95 and percentage <= 105:
                        status = "ممتاز"
                        status_color = "green"
                    elif percentage >= 85 and percentage <= 115:
                        status = "جيد"
                        status_color = "yellow"
                    else:
                        status = "يحتاج تحسين"
                        status_color = "red"
                else:
                    percentage = 0
                    difference = 0
                    status = "غير محدد"
                    status_color = "gray"
                
                comparison[field] = {
                    'actual': actual_val,
                    'target': target_val,
                    'difference': round(difference, 2),
                    'percentage': round(percentage, 1),
                    'status': status,
                    'status_color': status_color
                }
        
        return comparison

    def get_nutrition_summary_arabic(self, nutrition: Dict[str, float]) -> str:
        """ملخص القيم الغذائية بالعربية العراقية"""
        summary_parts = []
        
        if 'calories' in nutrition:
            summary_parts.append(f"السعرات الحرارية: {nutrition['calories']} سعرة")
        
        if 'protein' in nutrition:
            summary_parts.append(f"البروتين: {nutrition['protein']} جرام")
        
        if 'carbs' in nutrition:
            summary_parts.append(f"الكربوهيدرات: {nutrition['carbs']} جرام")
        
        if 'fat' in nutrition:
            summary_parts.append(f"الدهون: {nutrition['fat']} جرام")
        
        if 'fiber' in nutrition and nutrition['fiber'] > 0:
            summary_parts.append(f"الألياف: {nutrition['fiber']} جرام")
        
        return " | ".join(summary_parts)

    def search_iraqi_foods(self, query: str) -> List[Food]:
        """البحث عن الأطعمة العراقية"""
        return Food.objects.filter(
            Q(name_ar__icontains=query) | 
            Q(name__icontains=query) |
            Q(description__icontains=query)
        ).filter(is_active=True)

    def get_food_suggestions(self, category: str = None) -> List[Food]:
        """اقتراحات الأطعمة العراقية"""
        queryset = Food.objects.filter(is_active=True)
        
        if category:
            queryset = queryset.filter(category__name=category)
        
        return queryset.order_by('name_ar', 'name')[:20]


# دالة مساعدة للاستخدام في الـ views
def calculate_meal_nutrition_iraqi(meal_id: int) -> Dict[str, Any]:
    """حساب القيم الغذائية لوجبة بالطريقة العراقية"""
    try:
        meal = Meal.objects.get(id=meal_id)
        calculator = IraqiNutritionCalculator()
        return calculator.calculate_meal_nutrition(meal)
    except Meal.DoesNotExist:
        return {'error': 'الوجبة غير موجودة'}


def calculate_recipe_nutrition_iraqi(recipe_id: int) -> Dict[str, Any]:
    """حساب القيم الغذائية لوصفة بالطريقة العراقية"""
    try:
        recipe = Recipe.objects.get(id=recipe_id)
        calculator = IraqiNutritionCalculator()
        return calculator.calculate_recipe_nutrition(recipe)
    except Recipe.DoesNotExist:
        return {'error': 'الوصفة غير موجودة'}


def calculate_daily_plan_nutrition_iraqi(meal_plan_id: int) -> Dict[str, Any]:
    """حساب القيم الغذائية للخطة اليومية بالطريقة العراقية"""
    try:
        meal_plan = MealPlan.objects.get(id=meal_plan_id)
        calculator = IraqiNutritionCalculator()
        return calculator.calculate_daily_plan_nutrition(meal_plan)
    except MealPlan.DoesNotExist:
        return {'error': 'خطة الوجبات غير موجودة'}
