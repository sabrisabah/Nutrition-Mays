from django.urls import path
from . import views

urlpatterns = [
    # Food and Categories
    path('categories/', views.FoodCategoryListView.as_view(), name='food-categories'),
    path('foods/', views.FoodListView.as_view(), name='foods'),
    path('foods/<int:pk>/', views.FoodDetailView.as_view(), name='food-detail'),
    
    # Meal Plan Templates
    path('templates/', views.MealPlanTemplateListView.as_view(), name='meal-plan-templates'),
    path('templates/create/', views.MealPlanTemplateCreateView.as_view(), name='create-meal-plan-template'),
    
    # Meal Types
    path('meal-types/', views.MealTypeListView.as_view(), name='meal-types'),
    
    # Meal Plans
    path('meal-plans/', views.MealPlanListCreateView.as_view(), name='meal-plans'),
    path('meal-plans/<int:pk>/', views.MealPlanDetailView.as_view(), name='meal-plan-detail'),
    path('meal-plans/<int:meal_plan_id>/update-status/', views.update_meal_plan_status, name='update-meal-plan-status'),
    path('patients/<int:patient_id>/meal-plans/', views.PatientMealPlanListView.as_view(), name='patient-meal-plans'),
    
    # Patient Meal Selections
    path('patients/<int:patient_id>/selected-meals/', views.PatientMealSelectionsView.as_view(), name='patient-selected-meals'),
    
    # Meals
    path('meal-plans/<int:meal_plan_id>/meals/', views.MealListCreateView.as_view(), name='meals'),
    path('meals/<int:meal_id>/ingredients/', views.MealIngredientListCreateView.as_view(), name='meal-ingredients'),
    
    # Progress Tracking
    path('progress/', views.MealPlanProgressListCreateView.as_view(), name='meal-plan-progress'),
    
    # Recipes
    path('recipes/', views.RecipeListCreateView.as_view(), name='recipes'),
    path('recipes/<int:pk>/', views.RecipeDetailView.as_view(), name='recipe-detail'),
    
    # Utilities
    path('nutrition-calculator/', views.nutrition_calculator, name='nutrition-calculator'),
    path('meal-plans/<int:meal_plan_id>/generate-meals/', views.generate_meals_for_plan, name='generate-meals-for-plan'),
    path('meal-plans/<int:meal_plan_id>/save-selected-meals/', views.save_selected_meals, name='save-selected-meals'),
    path('meal-plans/check-updates/', views.check_meal_plan_updates, name='check-meal-plan-updates'),
    
    # ===== حاسبة القيم الغذائية العراقية =====
    path('iraqi-nutrition/meal/<int:meal_id>/', views.calculate_meal_nutrition_iraqi_api, name='calculate-meal-nutrition-iraqi'),
    path('iraqi-nutrition/recipe/<int:recipe_id>/', views.calculate_recipe_nutrition_iraqi_api, name='calculate-recipe-nutrition-iraqi'),
    path('iraqi-nutrition/meal-plan/<int:meal_plan_id>/', views.calculate_daily_plan_nutrition_iraqi_api, name='calculate-daily-plan-nutrition-iraqi'),
    path('iraqi-nutrition/custom/', views.calculate_custom_nutrition_iraqi_api, name='calculate-custom-nutrition-iraqi'),
    path('iraqi-nutrition/search-foods/', views.search_iraqi_foods_api, name='search-iraqi-foods'),
    path('iraqi-nutrition/food-suggestions/', views.get_food_suggestions_iraqi_api, name='get-food-suggestions-iraqi'),
    path('iraqi-nutrition/summary/', views.get_nutrition_summary_iraqi_api, name='get-nutrition-summary-iraqi'),
    path('iraqi-nutrition/compare-targets/<int:meal_plan_id>/', views.compare_nutrition_targets_api, name='compare-nutrition-targets'),
    
    # ===== قوالب الوجبات اليومية =====
    path('meal-templates/', views.get_meal_templates_api, name='get-meal-templates'),
    path('meal-templates/<int:template_id>/', views.get_meal_template_details_api, name='get-meal-template-details'),
    path('meal-templates/create-plan/', views.create_meal_plan_from_template_api, name='create-meal-plan-from-template'),
    path('patients/', views.get_patients_list_api, name='get-patients-list'),
]
