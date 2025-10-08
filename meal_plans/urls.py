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
]
