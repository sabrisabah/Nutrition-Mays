from django.contrib import admin
from .models import (
    FoodCategory, Food, MealPlanTemplate, MealPlan, MealType,
    Meal, MealIngredient, MealPlanProgress, Recipe, RecipeIngredient
)


@admin.register(FoodCategory)
class FoodCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_ar', 'created_at']
    search_fields = ['name', 'name_ar']


@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'calories_per_100g', 'protein_per_100g', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'name_ar']
    list_editable = ['is_active']


@admin.register(MealPlanTemplate)
class MealPlanTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan_type', 'target_calories', 'created_by', 'is_public']
    list_filter = ['plan_type', 'is_public']
    search_fields = ['name', 'name_ar']


@admin.register(MealType)
class MealTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_ar', 'order']
    list_editable = ['order']


@admin.register(MealPlan)
class MealPlanAdmin(admin.ModelAdmin):
    list_display = ['title', 'patient', 'doctor', 'start_date', 'end_date', 'is_active']
    list_filter = ['is_active', 'start_date', 'end_date']
    search_fields = ['title', 'patient__username', 'doctor__username']
    date_hierarchy = 'start_date'


class MealIngredientInline(admin.TabularInline):
    model = MealIngredient
    extra = 1


@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ['name', 'meal_plan', 'meal_type', 'day_of_week']
    list_filter = ['meal_type', 'day_of_week']
    search_fields = ['name', 'meal_plan__title']
    inlines = [MealIngredientInline]


@admin.register(MealPlanProgress)
class MealPlanProgressAdmin(admin.ModelAdmin):
    list_display = ['meal_plan', 'date', 'meal', 'completed', 'completion_percentage']
    list_filter = ['completed', 'date']
    search_fields = ['meal_plan__title', 'meal__name']
    date_hierarchy = 'date'


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['name', 'difficulty_level', 'prep_time', 'cook_time', 'servings', 'created_by', 'is_public']
    list_filter = ['difficulty_level', 'is_public']
    search_fields = ['name', 'name_ar']
    inlines = [RecipeIngredientInline]
