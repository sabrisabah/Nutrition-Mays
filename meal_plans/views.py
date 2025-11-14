from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Max
from django.db import models
from django.utils import timezone
from .models import (
    FoodCategory, Food, MealPlanTemplate, MealPlan, MealType,
    Meal, MealIngredient, MealPlanProgress, Recipe, RecipeIngredient
)
from accounts.models import User
from .serializers import (
    FoodCategorySerializer, FoodSerializer, MealPlanTemplateSerializer,
    MealPlanSerializer, MealTypeSerializer, MealSerializer,
    MealIngredientSerializer, MealPlanProgressSerializer,
    RecipeSerializer, RecipeIngredientSerializer, MealPlanCreateSerializer
)
from .nutrition_calculator import (
    IraqiNutritionCalculator, calculate_meal_nutrition_iraqi,
    calculate_recipe_nutrition_iraqi, calculate_daily_plan_nutrition_iraqi
)


class FoodCategoryListView(generics.ListAPIView):
    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class FoodListView(generics.ListAPIView):
    queryset = Food.objects.filter(is_active=True)
    serializer_class = FoodSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category']
    search_fields = ['name', 'name_ar']


class FoodDetailView(generics.RetrieveAPIView):
    queryset = Food.objects.filter(is_active=True)
    serializer_class = FoodSerializer
    permission_classes = [permissions.IsAuthenticated]


class MealPlanTemplateListView(generics.ListAPIView):
    serializer_class = MealPlanTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'doctor':
            return MealPlanTemplate.objects.filter(
                Q(is_public=True) | Q(created_by=self.request.user)
            )
        return MealPlanTemplate.objects.filter(is_public=True)


class MealPlanTemplateCreateView(generics.CreateAPIView):
    queryset = MealPlanTemplate.objects.all()
    serializer_class = MealPlanTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MealTypeListView(generics.ListAPIView):
    queryset = MealType.objects.all()
    serializer_class = MealTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class MealPlanListCreateView(generics.ListCreateAPIView):
    serializer_class = MealPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return MealPlan.objects.filter(patient=self.request.user)
        elif self.request.user.role == 'doctor':
            return MealPlan.objects.filter(doctor=self.request.user)
        elif self.request.user.role in ['admin', 'accountant']:
            return MealPlan.objects.all()
        return MealPlan.objects.none()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MealPlanCreateSerializer
        return MealPlanSerializer
    
    def perform_create(self, serializer):
        meal_plan = serializer.save(doctor=self.request.user)
        # Mark meal plan as delivered when created
        meal_plan.mark_as_delivered()
        return meal_plan


class MealPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MealPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return MealPlan.objects.filter(patient=self.request.user)
        elif self.request.user.role == 'doctor':
            return MealPlan.objects.filter(doctor=self.request.user)
        elif self.request.user.role in ['admin', 'accountant']:
            return MealPlan.objects.all()
        return MealPlan.objects.none()

    def update(self, request, *args, **kwargs):
        print(f"🔍 Updating meal plan {kwargs.get('pk')} with data:", request.data)
        response = super().update(request, *args, **kwargs)
        print(f"✅ Meal plan updated successfully: {response.data}")
        return response


class PatientMealPlanListView(generics.ListAPIView):
    serializer_class = MealPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        patient_id = self.kwargs.get('patient_id')
        # Allow patients to access their own meal plans
        if self.request.user.role == 'patient' and str(self.request.user.id) == str(patient_id):
            return MealPlan.objects.filter(patient_id=patient_id)
        # Allow doctors and admins to access any patient's meal plans
        elif self.request.user.role in ['doctor', 'admin']:
            return MealPlan.objects.filter(patient_id=patient_id)
        return MealPlan.objects.none()


class MealListCreateView(generics.ListCreateAPIView):
    serializer_class = MealSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        meal_plan_id = self.kwargs.get('meal_plan_id')
        return Meal.objects.filter(meal_plan_id=meal_plan_id)
    
    def perform_create(self, serializer):
        meal_plan_id = self.kwargs.get('meal_plan_id')
        serializer.save(meal_plan_id=meal_plan_id)


class MealIngredientListCreateView(generics.ListCreateAPIView):
    serializer_class = MealIngredientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        meal_id = self.kwargs.get('meal_id')
        return MealIngredient.objects.filter(meal_id=meal_id)
    
    def perform_create(self, serializer):
        meal_id = self.kwargs.get('meal_id')
        serializer.save(meal_id=meal_id)


class MealPlanProgressListCreateView(generics.ListCreateAPIView):
    serializer_class = MealPlanProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'patient':
            return MealPlanProgress.objects.filter(meal_plan__patient=self.request.user)
        elif self.request.user.role in ['doctor', 'admin']:
            meal_plan_id = self.request.query_params.get('meal_plan_id')
            if meal_plan_id:
                return MealPlanProgress.objects.filter(meal_plan_id=meal_plan_id)
            return MealPlanProgress.objects.all()
        return MealPlanProgress.objects.none()
    
    def perform_create(self, serializer):
        meal_plan_id = self.request.data.get('meal_plan_id')
        if self.request.user.role == 'patient':
            # Verify patient owns this meal plan
            meal_plan = MealPlan.objects.filter(id=meal_plan_id, patient=self.request.user).first()
            if meal_plan:
                serializer.save(meal_plan=meal_plan)
        else:
            serializer.save(meal_plan_id=meal_plan_id)


class RecipeListCreateView(generics.ListCreateAPIView):
    serializer_class = RecipeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['difficulty_level']
    search_fields = ['name', 'name_ar']
    
    def get_queryset(self):
        if self.request.user.role == 'doctor':
            return Recipe.objects.filter(
                Q(is_public=True) | Q(created_by=self.request.user)
            )
        return Recipe.objects.filter(is_public=True)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class RecipeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RecipeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'doctor':
            return Recipe.objects.filter(
                Q(is_public=True) | Q(created_by=self.request.user)
            )
        return Recipe.objects.filter(is_public=True)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_meal_plan_status(request, meal_plan_id):
    """Update meal plan status"""
    try:
        meal_plan = MealPlan.objects.get(id=meal_plan_id)
        
        # Check permissions
        if request.user.role == 'patient' and meal_plan.patient != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role == 'doctor' and meal_plan.doctor != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        
        if new_status == 'acknowledged':
            meal_plan.mark_as_acknowledged()
        elif new_status == 'in_progress':
            meal_plan.mark_as_in_progress()
        elif new_status == 'completed':
            meal_plan.mark_as_completed()
        elif new_status == 'cancelled':
            meal_plan.cancel_plan()
        else:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = MealPlanSerializer(meal_plan)
        return Response(serializer.data)
        
    except MealPlan.DoesNotExist:
        return Response({'error': 'Meal plan not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def nutrition_calculator(request):
    """Calculate nutrition for a list of foods and amounts"""
    foods_data = request.GET.get('foods', '[]')
    
    try:
        import json
        foods_list = json.loads(foods_data)
        
        total_nutrition = {
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fat': 0,
            'fiber': 0,
            'sugar': 0,
            'sodium': 0,
        }
        
        detailed_nutrition = []
        
        for item in foods_list:
            food_id = item.get('food_id')
            amount = float(item.get('amount', 0))
            
            try:
                food = Food.objects.get(id=food_id, is_active=True)
                nutrition = food.get_nutrition_for_amount(amount)
                
                detailed_nutrition.append({
                    'food_id': food_id,
                    'food_name': food.name,
                    'amount': amount,
                    'nutrition': nutrition
                })
                
                for key in total_nutrition:
                    total_nutrition[key] += nutrition.get(key, 0)
                    
            except Food.DoesNotExist:
                continue
        
        return Response({
            'total_nutrition': total_nutrition,
            'detailed_nutrition': detailed_nutrition
        })
        
    except (json.JSONDecodeError, ValueError) as e:
        return Response({'error': 'Invalid data format'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_meals_for_plan(request, meal_plan_id):
    """Generate suggested meals for a meal plan based on diet plan"""
    try:
        meal_plan = MealPlan.objects.get(id=meal_plan_id)
        
        # Check permissions
        if request.user.role == 'doctor' and meal_plan.doctor != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role not in ['doctor', 'admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get diet plan from request or meal plan
        diet_plan = request.data.get('diet_plan', meal_plan.diet_plan)
        
        if not diet_plan:
            return Response({'error': 'Diet plan is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get meal types
        try:
            breakfast = MealType.objects.get(name='Breakfast')
            lunch = MealType.objects.get(name='Lunch')
            dinner = MealType.objects.get(name='Dinner')
            morning_snack = MealType.objects.get(name='Morning Snack')
            afternoon_snack = MealType.objects.get(name='Afternoon Snack')
        except MealType.DoesNotExist:
            return Response({'error': 'Meal types not found. Please run setup_meal_types first.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Get foods based on diet plan
        foods = get_foods_for_diet_plan(diet_plan)
        
        if not foods:
            return Response({'error': f'No suitable foods found for diet plan: {diet_plan}'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Check if we have enough foods for each category
        for category, food_list in foods.items():
            if not food_list:
                return Response({'error': f'No foods found for category: {category} in diet plan: {diet_plan}'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        # Generate suggested meals for 7 days (don't save to database)
        suggested_meals = []
        for day in range(7):
            # Generate suggested meals for each day
            day_meals = generate_suggested_day_meals(meal_plan, day, diet_plan, foods, {
                'breakfast': breakfast,
                'lunch': lunch,
                'dinner': dinner,
                'morning_snack': morning_snack,
                'afternoon_snack': afternoon_snack
            })
            suggested_meals.extend(day_meals)
        
        # Return suggested meals
        return Response({
            'message': f'Successfully generated {len(suggested_meals)} suggested meals',
            'suggested_meals': suggested_meals,
            'diet_plan': diet_plan
        })
        
    except MealPlan.DoesNotExist:
        return Response({'error': 'Meal plan not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_selected_meals(request, meal_plan_id):
    """Save selected meals to the meal plan"""
    try:
        meal_plan = MealPlan.objects.get(id=meal_plan_id)
        
        # Check permissions
        if request.user.role == 'doctor' and meal_plan.doctor != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role not in ['doctor', 'admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        selected_meals = request.data.get('selected_meals', [])
        print(f"🔍 Selected meals received: {len(selected_meals)} meals")
        for i, meal in enumerate(selected_meals):
            print(f"  Meal {i+1}: {meal.get('name', 'Unknown')} - {len(meal.get('ingredients', []))} ingredients")
        
        if not selected_meals:
            return Response({'error': 'No meals selected'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Clear existing meals
        Meal.objects.filter(meal_plan=meal_plan).delete()
        
        # Save selected meals
        saved_meals = []
        for meal_data in selected_meals:
            try:
                meal_type = MealType.objects.get(id=meal_data['meal_type_id'])
                meal = Meal.objects.create(
                    meal_plan=meal_plan,
                    meal_type=meal_type,
                    day_of_week=meal_data['day_of_week'],
                    name=meal_data['name'],
                    description=meal_data['description'],
                    instructions=meal_data['instructions'],
                    prep_time=meal_data['prep_time']
                )
                
                # Add ingredients
                ingredients_count = len(meal_data.get('ingredients', []))
                print(f"  🍽️ Adding {ingredients_count} ingredients to meal {meal.name}")
                
                for ingredient_data in meal_data.get('ingredients', []):
                    try:
                        food = Food.objects.get(id=ingredient_data['food_id'])
                        MealIngredient.objects.create(
                            meal=meal,
                            food=food,
                            amount=ingredient_data['amount'],
                            unit=ingredient_data.get('unit', 'g'),
                            notes=ingredient_data.get('notes', '')
                        )
                        print(f"    ✅ Added: {food.name_ar} ({ingredient_data['amount']}g)")
                    except Food.DoesNotExist:
                        print(f"    ❌ Food not found: {ingredient_data.get('food_id', 'Unknown')}")
                        continue
                
                saved_meals.append(meal)
                
            except Exception as e:
                print(f"Error saving meal: {e}")
                continue
        
        # Return saved meals
        meal_serializer = MealSerializer(saved_meals, many=True)
        return Response({
            'message': f'Successfully saved {len(saved_meals)} meals',
            'meals': meal_serializer.data
        })
        
    except MealPlan.DoesNotExist:
        return Response({'error': 'Meal plan not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_foods_for_diet_plan(diet_plan):
    """Get suitable foods for a specific diet plan"""
    try:
        if diet_plan == 'keto':
            # Keto foods: high fat, low carb
            return {
                'proteins': Food.objects.filter(
                    Q(name__icontains='chicken') | Q(name__icontains='salmon') | 
                    Q(name__icontains='eggs') | Q(name__icontains='beef') |
                    Q(name__icontains='turkey') | Q(name__icontains='tuna') |
                    Q(name_ar__icontains='دجاج') | Q(name_ar__icontains='سلمون') |
                    Q(name_ar__icontains='بيض') | Q(name_ar__icontains='لحم')
                ).filter(is_active=True)[:10],
                'vegetables': Food.objects.filter(
                    Q(name__icontains='broccoli') | Q(name__icontains='spinach') |
                    Q(name__icontains='cauliflower') | Q(name__icontains='zucchini') |
                    Q(name__icontains='bell peppers') | Q(name__icontains='cucumber') |
                    Q(name_ar__icontains='بروكلي') | Q(name_ar__icontains='سبانخ') |
                    Q(name_ar__icontains='قرنبيط') | Q(name_ar__icontains='خيار')
                ).filter(is_active=True)[:8],
                'fats': Food.objects.filter(
                    Q(name__icontains='olive oil') | Q(name__icontains='avocado') |
                    Q(name__icontains='almonds') | Q(name__icontains='walnuts') |
                    Q(name__icontains='coconut oil') | Q(name__icontains='butter') |
                    Q(name_ar__icontains='زيت زيتون') | Q(name_ar__icontains='أفوكادو') |
                    Q(name_ar__icontains='لوز') | Q(name_ar__icontains='جوز')
                ).filter(is_active=True)[:6],
                'fruits': Food.objects.filter(
                    Q(name__icontains='avocado') | Q(name__icontains='lemon') |
                    Q(name_ar__icontains='أفوكادو') | Q(name_ar__icontains='ليمون')
                ).filter(is_active=True)[:2]
            }
        
        elif diet_plan == 'balanced':
            # Balanced diet: variety of foods
            return {
                'grains': Food.objects.filter(
                    Q(name__icontains='rice') | Q(name__icontains='oats') |
                    Q(name__icontains='quinoa') | Q(name__icontains='bread') |
                    Q(name_ar__icontains='أرز') | Q(name_ar__icontains='شوفان') |
                    Q(name_ar__icontains='كينوا') | Q(name_ar__icontains='خبز')
                ).filter(is_active=True)[:6],
                'proteins': Food.objects.filter(
                    Q(name__icontains='chicken') | Q(name__icontains='salmon') | 
                    Q(name__icontains='eggs') | Q(name__icontains='yogurt') |
                    Q(name__icontains='beans') | Q(name__icontains='lentils') |
                    Q(name_ar__icontains='دجاج') | Q(name_ar__icontains='سلمون') |
                    Q(name_ar__icontains='بيض') | Q(name_ar__icontains='زبادي') |
                    Q(name_ar__icontains='فول') | Q(name_ar__icontains='عدس')
                ).filter(is_active=True)[:8],
                'vegetables': Food.objects.filter(
                    Q(name__icontains='broccoli') | Q(name__icontains='spinach') |
                    Q(name__icontains='carrots') | Q(name__icontains='tomatoes') |
                    Q(name__icontains='bell peppers') | Q(name__icontains='cucumber') |
                    Q(name_ar__icontains='بروكلي') | Q(name_ar__icontains='سبانخ') |
                    Q(name_ar__icontains='جزر') | Q(name_ar__icontains='طماطم') |
                    Q(name_ar__icontains='فلفل') | Q(name_ar__icontains='خيار')
                ).filter(is_active=True)[:8],
                'fruits': Food.objects.filter(
                    Q(name__icontains='apple') | Q(name__icontains='banana') |
                    Q(name__icontains='orange') | Q(name__icontains='blueberries') |
                    Q(name__icontains='strawberries') | Q(name__icontains='avocado') |
                    Q(name_ar__icontains='تفاح') | Q(name_ar__icontains='موز') |
                    Q(name_ar__icontains='برتقال') | Q(name_ar__icontains='توت') |
                    Q(name_ar__icontains='فراولة') | Q(name_ar__icontains='أفوكادو')
                ).filter(is_active=True)[:6],
                'fats': Food.objects.filter(
                    Q(name__icontains='olive oil') | Q(name__icontains='almonds') |
                    Q(name__icontains='walnuts') | Q(name__icontains='avocado') |
                    Q(name_ar__icontains='زيت زيتون') | Q(name_ar__icontains='لوز') |
                    Q(name_ar__icontains='جوز') | Q(name_ar__icontains='أفوكادو')
                ).filter(is_active=True)[:4]
            }
        
        elif diet_plan == 'high_protein':
            # High protein diet
            return {
                'proteins': Food.objects.filter(
                    Q(name__icontains='chicken') | Q(name__icontains='salmon') | 
                    Q(name__icontains='eggs') | Q(name__icontains='beef') |
                    Q(name__icontains='turkey') | Q(name__icontains='tuna') |
                    Q(name__icontains='yogurt') | Q(name__icontains='cottage cheese')
                ).filter(is_active=True)[:10],
                'vegetables': Food.objects.filter(
                    Q(name__icontains='broccoli') | Q(name__icontains='spinach') |
                    Q(name__icontains='asparagus') | Q(name__icontains='green beans')
                ).filter(is_active=True)[:6],
                'grains': Food.objects.filter(
                    Q(name__icontains='rice') | Q(name__icontains='oats') |
                    Q(name__icontains='quinoa')
                ).filter(is_active=True)[:4],
                'fats': Food.objects.filter(
                    Q(name__icontains='olive oil') | Q(name__icontains='almonds') |
                    Q(name__icontains='avocado')
                ).filter(is_active=True)[:3]
            }
        
        elif diet_plan == 'mediterranean':
            # Mediterranean diet
            return {
                'proteins': Food.objects.filter(
                    Q(name__icontains='salmon') | Q(name__icontains='tuna') |
                    Q(name__icontains='chicken') | Q(name__icontains='eggs')
                ).filter(is_active=True)[:6],
                'vegetables': Food.objects.filter(
                    Q(name__icontains='tomatoes') | Q(name__icontains='bell peppers') |
                    Q(name__icontains='cucumber') | Q(name__icontains='olives') |
                    Q(name__icontains='spinach') | Q(name__icontains='broccoli')
                ).filter(is_active=True)[:8],
                'fruits': Food.objects.filter(
                    Q(name__icontains='olives') | Q(name__icontains='grapes') |
                    Q(name__icontains='figs') | Q(name__icontains='pomegranate')
                ).filter(is_active=True)[:4],
                'grains': Food.objects.filter(
                    Q(name__icontains='rice') | Q(name__icontains='oats')
                ).filter(is_active=True)[:3],
                'fats': Food.objects.filter(
                    Q(name__icontains='olive oil') | Q(name__icontains='olives') |
                    Q(name__icontains='almonds') | Q(name__icontains='walnuts')
                ).filter(is_active=True)[:4]
            }
        
        else:
            # Default balanced diet - use categories as fallback
            return {
                'grains': Food.objects.filter(
                    Q(category__name='Grains') | Q(category__name_ar='الحبوب')
                ).filter(is_active=True)[:6],
                'proteins': Food.objects.filter(
                    Q(category__name='Protein') | Q(category__name_ar='البروتين')
                ).filter(is_active=True)[:8],
                'vegetables': Food.objects.filter(
                    Q(category__name='Vegetables') | Q(category__name_ar='الخضروات')
                ).filter(is_active=True)[:8],
                'fruits': Food.objects.filter(
                    Q(category__name='Fruits') | Q(category__name_ar='الفواكه')
                ).filter(is_active=True)[:6],
                'fats': Food.objects.filter(
                    Q(category__name='Healthy Fats') | Q(category__name_ar='الدهون الصحية') |
                    Q(category__name='Nuts & Seeds') | Q(category__name_ar='المكسرات والبذور')
                ).filter(is_active=True)[:4]
            }
            
    except Exception as e:
        return None


def generate_day_meals(meal_plan, day, diet_plan, foods, meal_types):
    """Generate meals for a specific day"""
    created_meals = []
    
    # Breakfast
    breakfast_meal = create_meal(
        meal_plan=meal_plan,
        meal_type=meal_types['breakfast'],
        day=day,
        name=get_meal_name('breakfast', diet_plan),
        description=get_meal_description('breakfast', diet_plan),
        instructions=get_meal_instructions('breakfast', diet_plan),
        prep_time=15,
        foods=foods
    )
    if breakfast_meal:
        created_meals.append(breakfast_meal)
    
    # Morning Snack
    morning_snack_meal = create_meal(
        meal_plan=meal_plan,
        meal_type=meal_types['morning_snack'],
        day=day,
        name=get_meal_name('morning_snack', diet_plan),
        description=get_meal_description('morning_snack', diet_plan),
        instructions=get_meal_instructions('morning_snack', diet_plan),
        prep_time=5,
        foods=foods
    )
    if morning_snack_meal:
        created_meals.append(morning_snack_meal)
    
    # Lunch
    lunch_meal = create_meal(
        meal_plan=meal_plan,
        meal_type=meal_types['lunch'],
        day=day,
        name=get_meal_name('lunch', diet_plan),
        description=get_meal_description('lunch', diet_plan),
        instructions=get_meal_instructions('lunch', diet_plan),
        prep_time=30,
        foods=foods
    )
    if lunch_meal:
        created_meals.append(lunch_meal)
    
    # Afternoon Snack
    afternoon_snack_meal = create_meal(
        meal_plan=meal_plan,
        meal_type=meal_types['afternoon_snack'],
        day=day,
        name=get_meal_name('afternoon_snack', diet_plan),
        description=get_meal_description('afternoon_snack', diet_plan),
        instructions=get_meal_instructions('afternoon_snack', diet_plan),
        prep_time=5,
        foods=foods
    )
    if afternoon_snack_meal:
        created_meals.append(afternoon_snack_meal)
    
    # Dinner
    dinner_meal = create_meal(
        meal_plan=meal_plan,
        meal_type=meal_types['dinner'],
        day=day,
        name=get_meal_name('dinner', diet_plan),
        description=get_meal_description('dinner', diet_plan),
        instructions=get_meal_instructions('dinner', diet_plan),
        prep_time=25,
        foods=foods
    )
    if dinner_meal:
        created_meals.append(dinner_meal)
    
    return created_meals


def generate_suggested_day_meals(meal_plan, day, diet_plan, foods, meal_types):
    """Generate suggested meals for a specific day (without saving to database)"""
    suggested_meals = []
    
    # Breakfast suggestion
    breakfast_suggestion = create_suggested_meal(
        meal_plan=meal_plan,
        meal_type=meal_types['breakfast'],
        day=day,
        name=get_meal_name('breakfast', diet_plan),
        description=get_meal_description('breakfast', diet_plan),
        instructions=get_meal_instructions('breakfast', diet_plan),
        prep_time=15,
        foods=foods
    )
    if breakfast_suggestion:
        suggested_meals.append(breakfast_suggestion)
    
    # Morning Snack suggestion
    morning_snack_suggestion = create_suggested_meal(
        meal_plan=meal_plan,
        meal_type=meal_types['morning_snack'],
        day=day,
        name=get_meal_name('morning_snack', diet_plan),
        description=get_meal_description('morning_snack', diet_plan),
        instructions=get_meal_instructions('morning_snack', diet_plan),
        prep_time=5,
        foods=foods
    )
    if morning_snack_suggestion:
        suggested_meals.append(morning_snack_suggestion)
    
    # Lunch suggestion
    lunch_suggestion = create_suggested_meal(
        meal_plan=meal_plan,
        meal_type=meal_types['lunch'],
        day=day,
        name=get_meal_name('lunch', diet_plan),
        description=get_meal_description('lunch', diet_plan),
        instructions=get_meal_instructions('lunch', diet_plan),
        prep_time=30,
        foods=foods
    )
    if lunch_suggestion:
        suggested_meals.append(lunch_suggestion)
    
    # Afternoon Snack suggestion
    afternoon_snack_suggestion = create_suggested_meal(
        meal_plan=meal_plan,
        meal_type=meal_types['afternoon_snack'],
        day=day,
        name=get_meal_name('afternoon_snack', diet_plan),
        description=get_meal_description('afternoon_snack', diet_plan),
        instructions=get_meal_instructions('afternoon_snack', diet_plan),
        prep_time=5,
        foods=foods
    )
    if afternoon_snack_suggestion:
        suggested_meals.append(afternoon_snack_suggestion)
    
    # Dinner suggestion
    dinner_suggestion = create_suggested_meal(
        meal_plan=meal_plan,
        meal_type=meal_types['dinner'],
        day=day,
        name=get_meal_name('dinner', diet_plan),
        description=get_meal_description('dinner', diet_plan),
        instructions=get_meal_instructions('dinner', diet_plan),
        prep_time=25,
        foods=foods
    )
    if dinner_suggestion:
        suggested_meals.append(dinner_suggestion)
    
    return suggested_meals


def create_suggested_meal(meal_plan, meal_type, day, name, description, instructions, prep_time, foods):
    """Create a suggested meal (without saving to database)"""
    try:
        # Create meal data structure without saving to database
        suggested_meal = {
            'meal_plan_id': meal_plan.id,
            'meal_type_id': meal_type.id,
            'meal_type_name': meal_type.name,
            'meal_type_name_ar': meal_type.name_ar,
            'day_of_week': day,
            'name': name,
            'description': description,
            'instructions': instructions,
            'prep_time': prep_time,
            'ingredients': []
        }
        
        # Add ingredients based on meal type
        add_suggested_ingredients(suggested_meal, meal_type.name.lower(), foods)
        
        return suggested_meal
        
    except Exception as e:
        print(f"Error creating suggested meal: {e}")
        return None


def add_suggested_ingredients(suggested_meal, meal_type_name, foods):
    """Add suggested ingredients to a meal"""
    try:
        import random
        
        if 'breakfast' in meal_type_name.lower():
            # Breakfast ingredients
            if 'proteins' in foods and foods['proteins']:
                protein = random.choice(foods['proteins'])
                suggested_meal['ingredients'].append({
                    'food_id': protein.id,
                    'food_name': protein.name,
                    'food_name_ar': protein.name_ar,
                    'amount': 100,
                    'unit': 'g',
                    'notes': 'مطبوخ',
                    'calories_per_100g': protein.calories_per_100g or 0,
                    'protein_per_100g': protein.protein_per_100g or 0,
                    'carbs_per_100g': protein.carbs_per_100g or 0,
                    'fat_per_100g': protein.fat_per_100g or 0,
                    'fiber_per_100g': protein.fiber_per_100g or 0
                })
            
            if 'vegetables' in foods and foods['vegetables']:
                vegetable = random.choice(foods['vegetables'])
                suggested_meal['ingredients'].append({
                    'food_id': vegetable.id,
                    'food_name': vegetable.name,
                    'food_name_ar': vegetable.name_ar,
                    'amount': 150,
                    'unit': 'g',
                    'notes': 'طازج',
                    'calories_per_100g': vegetable.calories_per_100g or 0,
                    'protein_per_100g': vegetable.protein_per_100g or 0,
                    'carbs_per_100g': vegetable.carbs_per_100g or 0,
                    'fat_per_100g': vegetable.fat_per_100g or 0,
                    'fiber_per_100g': vegetable.fiber_per_100g or 0
                })
            
            if 'fats' in foods and foods['fats']:
                fat = random.choice(foods['fats'])
                suggested_meal['ingredients'].append({
                    'food_id': fat.id,
                    'food_name': fat.name,
                    'food_name_ar': fat.name_ar,
                    'amount': 10,
                    'unit': 'g',
                    'notes': 'للطبخ',
                    'calories_per_100g': fat.calories_per_100g or 0,
                    'protein_per_100g': fat.protein_per_100g or 0,
                    'carbs_per_100g': fat.carbs_per_100g or 0,
                    'fat_per_100g': fat.fat_per_100g or 0,
                    'fiber_per_100g': fat.fiber_per_100g or 0
                })
        
        elif 'lunch' in meal_type_name.lower():
            # Lunch ingredients
            if 'proteins' in foods and foods['proteins']:
                protein = random.choice(foods['proteins'])
                suggested_meal['ingredients'].append({
                    'food_id': protein.id,
                    'food_name': protein.name,
                    'food_name_ar': protein.name_ar,
                    'amount': 150,
                    'unit': 'g',
                    'notes': 'مطبوخ',
                    'calories_per_100g': protein.calories_per_100g or 0,
                    'protein_per_100g': protein.protein_per_100g or 0,
                    'carbs_per_100g': protein.carbs_per_100g or 0,
                    'fat_per_100g': protein.fat_per_100g or 0,
                    'fiber_per_100g': protein.fiber_per_100g or 0
                })
            
            if 'vegetables' in foods and foods['vegetables']:
                vegetable = random.choice(foods['vegetables'])
                suggested_meal['ingredients'].append({
                    'food_id': vegetable.id,
                    'food_name': vegetable.name,
                    'food_name_ar': vegetable.name_ar,
                    'amount': 200,
                    'unit': 'g',
                    'notes': 'طازج',
                    'calories_per_100g': vegetable.calories_per_100g or 0,
                    'protein_per_100g': vegetable.protein_per_100g or 0,
                    'carbs_per_100g': vegetable.carbs_per_100g or 0,
                    'fat_per_100g': vegetable.fat_per_100g or 0,
                    'fiber_per_100g': vegetable.fiber_per_100g or 0
                })
            
            if 'fats' in foods and foods['fats']:
                fat = random.choice(foods['fats'])
                suggested_meal['ingredients'].append({
                    'food_id': fat.id,
                    'food_name': fat.name,
                    'food_name_ar': fat.name_ar,
                    'amount': 15,
                    'unit': 'g',
                    'notes': 'للطبخ',
                    'calories_per_100g': fat.calories_per_100g or 0,
                    'protein_per_100g': fat.protein_per_100g or 0,
                    'carbs_per_100g': fat.carbs_per_100g or 0,
                    'fat_per_100g': fat.fat_per_100g or 0,
                    'fiber_per_100g': fat.fiber_per_100g or 0
                })
        
        elif 'dinner' in meal_type_name.lower():
            # Dinner ingredients
            if 'proteins' in foods and foods['proteins']:
                protein = random.choice(foods['proteins'])
                suggested_meal['ingredients'].append({
                    'food_id': protein.id,
                    'food_name': protein.name,
                    'food_name_ar': protein.name_ar,
                    'amount': 120,
                    'unit': 'g',
                    'notes': 'مطبوخ',
                    'calories_per_100g': protein.calories_per_100g or 0,
                    'protein_per_100g': protein.protein_per_100g or 0,
                    'carbs_per_100g': protein.carbs_per_100g or 0,
                    'fat_per_100g': protein.fat_per_100g or 0,
                    'fiber_per_100g': protein.fiber_per_100g or 0
                })
            
            if 'vegetables' in foods and foods['vegetables']:
                vegetable = random.choice(foods['vegetables'])
                suggested_meal['ingredients'].append({
                    'food_id': vegetable.id,
                    'food_name': vegetable.name,
                    'food_name_ar': vegetable.name_ar,
                    'amount': 180,
                    'unit': 'g',
                    'notes': 'طازج',
                    'calories_per_100g': vegetable.calories_per_100g or 0,
                    'protein_per_100g': vegetable.protein_per_100g or 0,
                    'carbs_per_100g': vegetable.carbs_per_100g or 0,
                    'fat_per_100g': vegetable.fat_per_100g or 0,
                    'fiber_per_100g': vegetable.fiber_per_100g or 0
                })
            
            if 'fats' in foods and foods['fats']:
                fat = random.choice(foods['fats'])
                suggested_meal['ingredients'].append({
                    'food_id': fat.id,
                    'food_name': fat.name,
                    'food_name_ar': fat.name_ar,
                    'amount': 8,
                    'unit': 'g',
                    'notes': 'للطبخ',
                    'calories_per_100g': fat.calories_per_100g or 0,
                    'protein_per_100g': fat.protein_per_100g or 0,
                    'carbs_per_100g': fat.carbs_per_100g or 0,
                    'fat_per_100g': fat.fat_per_100g or 0,
                    'fiber_per_100g': fat.fiber_per_100g or 0
                })
        
        elif 'snack' in meal_type_name.lower():
            # Snack ingredients
            if 'fruits' in foods and foods['fruits']:
                fruit = random.choice(foods['fruits'])
                suggested_meal['ingredients'].append({
                    'food_id': fruit.id,
                    'food_name': fruit.name,
                    'food_name_ar': fruit.name_ar,
                    'amount': 100,
                    'unit': 'g',
                    'notes': 'طازج',
                    'calories_per_100g': fruit.calories_per_100g or 0,
                    'protein_per_100g': fruit.protein_per_100g or 0,
                    'carbs_per_100g': fruit.carbs_per_100g or 0,
                    'fat_per_100g': fruit.fat_per_100g or 0,
                    'fiber_per_100g': fruit.fiber_per_100g or 0
                })
            
            if 'fats' in foods and foods['fats']:
                fat = random.choice(foods['fats'])
                suggested_meal['ingredients'].append({
                    'food_id': fat.id,
                    'food_name': fat.name,
                    'food_name_ar': fat.name_ar,
                    'amount': 15,
                    'unit': 'g',
                    'notes': 'طازج',
                    'calories_per_100g': fat.calories_per_100g or 0,
                    'protein_per_100g': fat.protein_per_100g or 0,
                    'carbs_per_100g': fat.carbs_per_100g or 0,
                    'fat_per_100g': fat.fat_per_100g or 0,
                    'fiber_per_100g': fat.fiber_per_100g or 0
                })
    
    except Exception as e:
        print(f"Error adding suggested ingredients: {e}")


def create_meal(meal_plan, meal_type, day, name, description, instructions, prep_time, foods):
    """Create a meal with ingredients"""
    try:
        meal = Meal.objects.create(
            meal_plan=meal_plan,
            meal_type=meal_type,
            day_of_week=day,
            name=name,
            description=description,
            instructions=instructions,
            prep_time=prep_time
        )
        
        # Add ingredients based on meal type and diet plan
        add_ingredients_to_meal(meal, meal_type.name, foods)
        
        return meal
    except Exception as e:
        return None


def add_ingredients_to_meal(meal, meal_type_name, foods):
    """Add appropriate ingredients to a meal"""
    import random
    
    try:
        if meal_type_name == 'Breakfast':
            # Breakfast ingredients
            if 'proteins' in foods and foods['proteins']:
                protein = random.choice(foods['proteins'])
                MealIngredient.objects.create(
                    meal=meal,
                    food=protein,
                    amount=100,
                    notes='مطبوخ'
                )
            
            if 'grains' in foods and foods['grains']:
                grain = random.choice(foods['grains'])
                MealIngredient.objects.create(
                    meal=meal,
                    food=grain,
                    amount=50,
                    notes='مطبوخ'
                )
            
            if 'fruits' in foods and foods['fruits']:
                fruit = random.choice(foods['fruits'])
                MealIngredient.objects.create(
                    meal=meal,
                    food=fruit,
                    amount=80,
                    notes='طازج'
                )
        
        elif meal_type_name == 'Lunch':
            # Lunch ingredients
            if 'proteins' in foods and foods['proteins']:
                protein = random.choice(foods['proteins'])
                MealIngredient.objects.create(
                    meal=meal,
                    food=protein,
                    amount=150,
                    notes='مشوي'
                )
            
            if 'vegetables' in foods and foods['vegetables']:
                vegetable = random.choice(foods['vegetables'])
                MealIngredient.objects.create(
                    meal=meal,
                    food=vegetable,
                    amount=100,
                    notes='مطبوخ على البخار'
                )
            
            if 'grains' in foods and foods['grains']:
                grain = random.choice(foods['grains'])
                MealIngredient.objects.create(
                    meal=meal,
                    food=grain,
                    amount=80,
                    notes='مطبوخ'
                )
            
            if 'fats' in foods and foods['fats']:
                fat = random.choice(foods['fats'])
                MealIngredient.objects.create(
                    meal=meal,
                    food=fat,
                    amount=10,
                    notes='للطبخ'
                )
        
        elif meal_type_name == 'Dinner':
            # Dinner ingredients
            if 'proteins' in foods and foods['proteins']:
                protein = random.choice(foods['proteins'])
                MealIngredient.objects.create(
                    meal=meal,
                    food=protein,
                    amount=120,
                    notes='مشوي'
                )
            
            if 'vegetables' in foods and foods['vegetables']:
                vegetable = random.choice(foods['vegetables'])
                MealIngredient.objects.create(
                    meal=meal,
                    food=vegetable,
                    amount=80,
                    notes='مطبوخ'
                )
            
            if 'fats' in foods and foods['fats']:
                fat = random.choice(foods['fats'])
                MealIngredient.objects.create(
                    meal=meal,
                    food=fat,
                    amount=8,
                    notes='للطبخ'
                )
        
        elif 'Snack' in meal_type_name:
            # Snack ingredients
            if 'fruits' in foods and foods['fruits']:
                fruit = random.choice(foods['fruits'])
                MealIngredient.objects.create(
                    meal=meal,
                    food=fruit,
                    amount=100,
                    notes='طازج'
                )
            
            if 'fats' in foods and foods['fats']:
                fat = random.choice(foods['fats'])
                MealIngredient.objects.create(
                    meal=meal,
                    food=fat,
                    amount=15,
                    notes='طازج'
                )
    
    except Exception as e:
        pass


def get_meal_name(meal_type, diet_plan):
    """Get meal name based on type and diet plan"""
    names = {
        'breakfast': {
            'keto': 'فطور كيتو صحي',
            'balanced': 'فطور متوازن',
            'high_protein': 'فطور عالي البروتين',
            'mediterranean': 'فطور متوسطي',
            'default': 'فطور صحي'
        },
        'lunch': {
            'keto': 'غداء كيتو',
            'balanced': 'غداء متوازن',
            'high_protein': 'غداء عالي البروتين',
            'mediterranean': 'غداء متوسطي',
            'default': 'غداء صحي'
        },
        'dinner': {
            'keto': 'عشاء كيتو خفيف',
            'balanced': 'عشاء متوازن',
            'high_protein': 'عشاء عالي البروتين',
            'mediterranean': 'عشاء متوسطي',
            'default': 'عشاء صحي'
        },
        'morning_snack': {
            'keto': 'وجبة خفيفة كيتو',
            'balanced': 'وجبة خفيفة صباحية',
            'high_protein': 'وجبة خفيفة بروتينية',
            'mediterranean': 'وجبة خفيفة متوسطية',
            'default': 'وجبة خفيفة صباحية'
        },
        'afternoon_snack': {
            'keto': 'وجبة خفيفة كيتو',
            'balanced': 'وجبة خفيفة بعد الظهر',
            'high_protein': 'وجبة خفيفة بروتينية',
            'mediterranean': 'وجبة خفيفة متوسطية',
            'default': 'وجبة خفيفة بعد الظهر'
        }
    }
    
    return names.get(meal_type, {}).get(diet_plan, names.get(meal_type, {}).get('default', 'وجبة صحية'))


def get_meal_description(meal_type, diet_plan):
    """Get meal description based on type and diet plan"""
    descriptions = {
        'breakfast': {
            'keto': 'فطور غني بالدهون الصحية ومنخفض الكربوهيدرات',
            'balanced': 'فطور متوازن يحتوي على البروتين والكربوهيدرات المعقدة',
            'high_protein': 'فطور غني بالبروتين لبناء العضلات',
            'mediterranean': 'فطور متوسطي صحي ومتوازن',
            'default': 'فطور صحي ومتوازن'
        },
        'lunch': {
            'keto': 'غداء كيتو مع بروتين وخضروات منخفضة الكربوهيدرات',
            'balanced': 'غداء متوازن مع بروتين وخضروات وحبوب',
            'high_protein': 'غداء عالي البروتين مع خضروات',
            'mediterranean': 'غداء متوسطي مع أسماك وخضروات',
            'default': 'غداء صحي ومتوازن'
        },
        'dinner': {
            'keto': 'عشاء كيتو خفيف مع بروتين وخضروات',
            'balanced': 'عشاء متوازن وخفيف',
            'high_protein': 'عشاء عالي البروتين',
            'mediterranean': 'عشاء متوسطي خفيف',
            'default': 'عشاء صحي وخفيف'
        },
        'morning_snack': {
            'keto': 'وجبة خفيفة كيتو مع دهون صحية',
            'balanced': 'وجبة خفيفة صباحية صحية',
            'high_protein': 'وجبة خفيفة بروتينية',
            'mediterranean': 'وجبة خفيفة متوسطية',
            'default': 'وجبة خفيفة صباحية'
        },
        'afternoon_snack': {
            'keto': 'وجبة خفيفة كيتو',
            'balanced': 'وجبة خفيفة بعد الظهر',
            'high_protein': 'وجبة خفيفة بروتينية',
            'mediterranean': 'وجبة خفيفة متوسطية',
            'default': 'وجبة خفيفة بعد الظهر'
        }
    }
    
    return descriptions.get(meal_type, {}).get(diet_plan, descriptions.get(meal_type, {}).get('default', 'وجبة صحية ومتوازنة'))


def get_meal_instructions(meal_type, diet_plan):
    """Get meal preparation instructions"""
    instructions = {
        'breakfast': 'اطبخ المكونات على نار متوسطة حتى تنضج، ثم قدمها ساخنة',
        'lunch': 'اشوي البروتين مع الخضروات، واطبخ الحبوب حسب التعليمات',
        'dinner': 'اطبخ المكونات على نار هادئة، وقدمها ساخنة',
        'morning_snack': 'قدم المكونات طازجة كما هي',
        'afternoon_snack': 'اخلط المكونات وقدمها فوراً'
    }
    
    return instructions.get(meal_type, 'اطبخ المكونات حسب التعليمات وقدمها ساخنة')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_meal_plan_updates(request):
    """
    Check for meal plan updates for real-time synchronization
    """
    try:
        # Get the latest update time for the user's meal plans
        # Support both patients and doctors
        if hasattr(request.user, 'role') and request.user.role == 'doctor':
            # For doctors, get all meal plans they created
            meal_plan_updates = MealPlan.objects.filter(
                doctor=request.user
            ).aggregate(
                latest_updated=Max('updated_at')
            )
        else:
            # For patients, get their meal plans
            meal_plan_updates = MealPlan.objects.filter(
                patient=request.user
            ).aggregate(
                latest_updated=Max('updated_at')
            )
        
        # Get the most recent update time from meal plans only
        # Since Meal and MealIngredient don't have updated_at fields
        last_updated = meal_plan_updates.get('latest_updated')
        
        if last_updated is None:
            last_updated = timezone.now()
        
        return Response({
            'last_updated': last_updated.isoformat(),
            'has_updates': True
        })
        
    except Exception as e:
        print(f"Error in check_meal_plan_updates: {e}")
        return Response({
            'error': str(e),
            'last_updated': timezone.now().isoformat(),
            'has_updates': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PatientMealSelectionsView(APIView):
    """Handle patient meal selections"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, patient_id):
        """Get patient's selected meals"""
        try:
            # Check permissions
            if request.user.role == 'patient' and str(request.user.id) != str(patient_id):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            elif request.user.role not in ['patient', 'doctor', 'admin']:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
            # Get date filter if provided
            date_filter = request.GET.get('date')
            
            # Import the models
            from .models import PatientMealSelection, MealPlan, Meal
            
            # Get patient's active meal plans
            active_meal_plans = MealPlan.objects.filter(
                patient_id=patient_id,
                is_active=True
            )
            
            # Get meal_plan_id filter if provided (to show only selections for a specific meal plan)
            meal_plan_id_filter = request.GET.get('meal_plan_id')
            
            # Query actual selections from database
            # Filter by patient and optionally by meal plan
            selections = PatientMealSelection.objects.filter(patient_id=patient_id)
            
            # Filter by meal plan if provided
            if meal_plan_id_filter:
                try:
                    selections = selections.filter(meal_plan_id=meal_plan_id_filter)
                    print(f"🔍 Filtering selections by meal_plan_id: {meal_plan_id_filter}")
                except ValueError:
                    pass  # Invalid meal_plan_id, ignore filter
            
            # Apply date filter if provided
            if date_filter:
                from datetime import datetime
                try:
                    filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
                    selections = selections.filter(selected_at__date=filter_date)
                    print(f"🔍 Filtering selections by date: {filter_date}")
                except ValueError:
                    pass  # Invalid date format, ignore filter
            
            # Remove duplicates based on unique_together constraint (patient, meal_plan, meal_name, meal_type)
            # Get only the most recent selection for each unique combination
            from django.db.models import Max
            print(f"📊 Total selections before deduplication: {selections.count()}")
            
            # Order by selected_at descending to get most recent first
            selections_list = list(selections.order_by('-selected_at'))
            unique_selections = []
            seen_combinations = set()
            
            for selection in selections_list:
                # Create a unique key based on unique_together constraint
                unique_key = (selection.patient_id, selection.meal_plan_id, selection.meal_name, selection.meal_type)
                
                # Only add if we haven't seen this combination before
                if unique_key not in seen_combinations:
                    unique_selections.append(selection)
                    seen_combinations.add(unique_key)
                    print(f"✅ Added unique selection: {selection.meal_name} ({selection.meal_type}) - ID: {selection.id}, Meal Plan: {selection.meal_plan_id}")
                else:
                    print(f"⚠️ Skipping duplicate selection: {selection.meal_name} ({selection.meal_type}) for meal_plan {selection.meal_plan_id} - ID: {selection.id}")
            
            selections = unique_selections
            print(f"📊 Total selections after deduplication: {len(selections)}")
            
            # Convert to response format
            selections_data = []
            for selection in selections:
                print(f"🔍 Backend - PatientMealSelectionsView - Processing selection: {selection.meal_name}")
                print(f"🔍 Backend - PatientMealSelectionsView - Ingredients: {selection.ingredients}")
                print(f"🔍 Backend - PatientMealSelectionsView - Ingredients type: {type(selection.ingredients)}")
                print(f"🔍 Backend - PatientMealSelectionsView - Ingredients length: {len(selection.ingredients) if selection.ingredients else 0}")
                
                # Calculate calories from ingredients to ensure accuracy
                calculated_calories_from_ingredients = 0
                calculated_protein_from_ingredients = 0
                calculated_carbs_from_ingredients = 0
                calculated_fat_from_ingredients = 0
                
                if selection.ingredients:
                    for ingredient in selection.ingredients:
                        # Get calories from ingredient
                        ing_calories = ingredient.get('calories', 0)
                        if ing_calories == 0:
                            calories_per_100g = ingredient.get('calories_per_100g', 0)
                            amount = ingredient.get('amount', 0)
                            if calories_per_100g > 0 and amount > 0:
                                ing_calories = (calories_per_100g * amount) / 100
                        
                        # Get other nutrients
                        ing_protein = ingredient.get('protein', 0)
                        if ing_protein == 0:
                            protein_per_100g = ingredient.get('protein_per_100g', 0)
                            amount = ingredient.get('amount', 0)
                            if protein_per_100g > 0 and amount > 0:
                                ing_protein = (protein_per_100g * amount) / 100
                        
                        ing_carbs = ingredient.get('carbs', 0)
                        if ing_carbs == 0:
                            carbs_per_100g = ingredient.get('carbs_per_100g', 0)
                            amount = ingredient.get('amount', 0)
                            if carbs_per_100g > 0 and amount > 0:
                                ing_carbs = (carbs_per_100g * amount) / 100
                        
                        ing_fat = ingredient.get('fat', 0)
                        if ing_fat == 0:
                            fat_per_100g = ingredient.get('fat_per_100g', 0)
                            amount = ingredient.get('amount', 0)
                            if fat_per_100g > 0 and amount > 0:
                                ing_fat = (fat_per_100g * amount) / 100
                        
                        calculated_calories_from_ingredients += ing_calories
                        calculated_protein_from_ingredients += ing_protein
                        calculated_carbs_from_ingredients += ing_carbs
                        calculated_fat_from_ingredients += ing_fat
                
                # Use calculated values from ingredients to ensure they match the sum
                # This ensures displayed calories match the sum of ingredient calories
                final_calories = round(calculated_calories_from_ingredients, 1) if calculated_calories_from_ingredients > 0 else (selection.calories if selection.calories > 0 else 0)
                final_protein = round(calculated_protein_from_ingredients, 1) if calculated_protein_from_ingredients > 0 else (selection.protein if selection.protein > 0 else 0)
                final_carbs = round(calculated_carbs_from_ingredients, 1) if calculated_carbs_from_ingredients > 0 else (selection.carbs if selection.carbs > 0 else 0)
                final_fat = round(calculated_fat_from_ingredients, 1) if calculated_fat_from_ingredients > 0 else (selection.fat if selection.fat > 0 else 0)
                
                print(f"📊 Selection: {selection.meal_name} - Saved: {selection.calories}, Calculated from ingredients: {round(calculated_calories_from_ingredients, 1)}, Final: {final_calories}")
                
                selections_data.append({
                    'id': selection.id,
                    'meal_name': selection.meal_name,
                    'meal_type': selection.meal_type,
                    'selected_at': selection.selected_at.isoformat(),
                    'calories': final_calories,  # Calories match sum of ingredients
                    'nutrition_info': {
                        'calories': final_calories,
                        'protein': final_protein,
                        'carbs': final_carbs,
                        'fat': final_fat
                    },
                    'ingredients': selection.ingredients or [],
                    'notes': selection.notes,
                    'is_confirmed': selection.is_confirmed
                })
            
            # NOTE: We should NOT add meals from MealPlan here because:
            # 1. PatientMealSelection already contains the meals the patient selected
            # 2. Adding MealPlan meals would cause duplicates (patient sees 10, doctor sees 20)
            # 3. If doctor wants to see meal plan meals, they should use a different endpoint
            
            # Only add meals from active meal plans if explicitly requested (for backward compatibility)
            include_meal_plan_meals = request.GET.get('include_meal_plan_meals', 'false').lower() == 'true'
            
            if include_meal_plan_meals:
                print("📊 Including meal plan meals (requested explicitly)")
                for meal_plan in active_meal_plans:
                    # Check if the meal plan covers the selected date
                    if date_filter:
                        from datetime import datetime
                        try:
                            filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
                            meal_plan_start = meal_plan.start_date
                            meal_plan_end = meal_plan.end_date
                            
                            # Check if the date is within the meal plan period
                            if not (meal_plan_start <= filter_date <= meal_plan_end):
                                continue
                        except ValueError:
                            pass  # Invalid date format, ignore filter
                    
                    # Get meals from this meal plan
                    meals = Meal.objects.filter(meal_plan=meal_plan)
                    
                    for meal in meals:
                        # Calculate nutrition for the meal
                        total_calories = 0
                        total_protein = 0
                        total_carbs = 0
                        total_fat = 0
                        ingredients_data = []
                        
                        for ingredient in meal.ingredients.all():
                            try:
                                # Calculate nutrition based on amount
                                amount = ingredient.amount or 0
                                food = ingredient.food
                                
                                if not food:
                                    continue  # Skip if food is None
                                
                                # Calculate nutrition values (unrounded for accurate summation)
                                calories_unrounded = (food.calories_per_100g * amount / 100) if food.calories_per_100g else 0
                                protein_unrounded = (food.protein_per_100g * amount / 100) if food.protein_per_100g else 0
                                carbs_unrounded = (food.carbs_per_100g * amount / 100) if food.carbs_per_100g else 0
                                fat_unrounded = (food.fat_per_100g * amount / 100) if food.fat_per_100g else 0
                                
                                # Round individual ingredient values for display
                                calories_rounded = round(calories_unrounded, 1)
                                protein_rounded = round(protein_unrounded, 1)
                                carbs_rounded = round(carbs_unrounded, 1)
                                fat_rounded = round(fat_unrounded, 1)
                                
                                # Store rounded values in ingredients_data (these will be summed later)
                                ingredients_data.append({
                                    'food_id': food.id,
                                    'food_name_ar': food.name_ar or food.name or 'Unknown',
                                    'food_name': food.name or 'Unknown',
                                    'amount': amount,
                                    'unit': 'g',  # Default unit is grams
                                    'calories_per_100g': food.calories_per_100g or 0,
                                    'protein_per_100g': food.protein_per_100g or 0,
                                    'carbs_per_100g': food.carbs_per_100g or 0,
                                    'fat_per_100g': food.fat_per_100g or 0,
                                    'calories': calories_rounded,  # Rounded value for display
                                    'protein': protein_rounded,
                                    'carbs': carbs_rounded,
                                    'fat': fat_rounded,
                                    'notes': ingredient.notes or ''
                                })
                            except Exception as e:
                                print(f"Error processing ingredient {ingredient.id}: {e}")
                                continue  # Skip this ingredient and continue
                    
                        # Recalculate total from rounded ingredient values to ensure consistency
                        # This ensures the displayed total matches the sum of displayed ingredient calories exactly
                        recalculated_calories = sum(ing.get('calories', 0) for ing in ingredients_data)
                        recalculated_protein = sum(ing.get('protein', 0) for ing in ingredients_data)
                        recalculated_carbs = sum(ing.get('carbs', 0) for ing in ingredients_data)
                        recalculated_fat = sum(ing.get('fat', 0) for ing in ingredients_data)
                        
                        # Round the final totals to 1 decimal place to match ingredient rounding
                        # This ensures perfect match between displayed total and sum of displayed ingredients
                        final_meal_calories = round(recalculated_calories, 1)
                        final_meal_protein = round(recalculated_protein, 1)
                        final_meal_carbs = round(recalculated_carbs, 1)
                        final_meal_fat = round(recalculated_fat, 1)
                        
                        # Verify calculation matches (for debugging)
                        verification_sum = sum(round(ing.get('calories', 0), 1) for ing in ingredients_data)
                        if abs(final_meal_calories - verification_sum) > 0.1:
                            print(f"⚠️ Warning: Meal {meal.name} - Total: {final_meal_calories}, Sum of ingredients: {verification_sum}")
                        
                        # Add meal to selections data
                        # Ensure calories field matches the sum of ingredient calories exactly
                        try:
                            selections_data.append({
                                'id': f"meal_{meal.id}",
                                'meal_name': meal.name or 'Unknown Meal',
                                'meal_type': meal.meal_type.name if meal.meal_type else 'unknown',
                                'selected_at': meal_plan.created_at.isoformat(),
                                'calories': final_meal_calories,  # Calories match sum of ingredients exactly
                                'nutrition_info': {
                                    'calories': final_meal_calories,  # Same value to ensure consistency
                                    'protein': final_meal_protein,
                                    'carbs': final_meal_carbs,
                                    'fat': final_meal_fat
                                },
                                'ingredients': ingredients_data,
                                'notes': meal.description or '',
                                'is_confirmed': True,
                                'is_doctor_selected': True,
                                'meal_plan_title': meal_plan.title or 'Unknown Plan'
                            })
                        except Exception as e:
                            print(f"Error processing meal {meal.id}: {e}")
                            continue  # Skip this meal and continue
            
            # Calculate and include required calories (Daily calories = TDEE + goal adjustment)
            # في صفحة المريض: السعرات المطلوبة = السعرات اليومية المحسوبة (TDEE + goal adjustment)
            # هذا هو نفس الحساب في صفحة الطبيب: السعرات اليومية المحسوبة
            required_calories = None
            patient_profile = None
            goal_adjustment = 0
            try:
                from accounts.models import PatientProfile
                patient = User.objects.get(id=patient_id)
                try:
                    patient_profile = PatientProfile.objects.get(user=patient)
                    # استخدام السعرات اليومية المحسوبة (TDEE + goal adjustment) كالسعرات المطلوبة
                    # هذا هو نفس الحساب في صفحة الطبيب: السعرات اليومية المحسوبة
                    daily_calories = patient_profile.calculate_daily_calories(force_recalculate=True)
                    
                    # التأكد من أن السعرات اليومية محسوبة بشكل صحيح
                    if daily_calories and daily_calories > 0:
                        required_calories = daily_calories
                        
                        # تحديث daily_calories المحفوظة لتطابق السعرات المحسوبة (TDEE + goal adjustment)
                        # هذا يضمن أن القيمة المعروضة دائماً تعكس السعرات اليومية المحسوبة
                        if patient_profile.daily_calories != daily_calories:
                            print(f"🔄 Updating daily_calories from {patient_profile.daily_calories} to calculated: {daily_calories}")
                            patient_profile.daily_calories = daily_calories
                            patient_profile.save(update_fields=['daily_calories'])
                    else:
                        # Fallback: استخدام daily_calories المحفوظة إذا كان الحساب فشل
                        required_calories = patient_profile.daily_calories if patient_profile.daily_calories and patient_profile.daily_calories > 0 else None
                        print(f"⚠️ Daily calories calculation failed, using saved daily_calories: {required_calories}")
                    
                    # حساب TDEE و goal adjustment للاستخدام في تعديل المكونات
                    tdee = patient_profile.calculate_tdee()
                    goal_adjustments = {
                        'lose_weight': -500,
                        'gain_weight': 500,
                        'build_muscle': 300,
                        'maintain_weight': 0,
                        'improve_health': 0
                    }
                    goal_adjustment = goal_adjustments.get(patient_profile.goal, 0)
                    
                    print(f"📊 GET - Required calories (Daily calories = TDEE + goal adjustment): {required_calories}")
                    print(f"📊 GET - TDEE: {tdee}, Goal: {patient_profile.goal}, Adjustment: {goal_adjustment}")
                    print(f"📊 GET - Target for meal adjustment: {required_calories} (same as required - no additional adjustment needed)")
                except PatientProfile.DoesNotExist:
                    print(f"⚠️ PatientProfile not found for patient {patient_id}")
                    pass
            except Exception as e:
                print(f"❌ Error calculating required calories: {e}")
                import traceback
                traceback.print_exc()
                pass
            
            # Calculate total calories from current selections
            total_current_calories = sum(sel.get('calories', 0) for sel in selections_data)
            print(f"📊 GET - Current total calories from selections: {total_current_calories}")
            
            # Adjust selections to match required calories (Daily calories = TDEE + goal adjustment)
            # السعرات المطلوبة للعرض = السعرات اليومية المحسوبة (TDEE + goal adjustment)
            # السعرات المستهدفة لتعديل المكونات = نفس السعرات المطلوبة (لا حاجة لتعديل إضافي)
            target_calories_for_adjustment = required_calories
            
            if target_calories_for_adjustment and target_calories_for_adjustment > 0 and selections_data and len(selections_data) > 0:
                tolerance = 5  # Allow only 5 calories difference
                difference = target_calories_for_adjustment - total_current_calories
                
                print(f"🔧 GET - Adjustment check:")
                print(f"  Required (TDEE for display): {required_calories}")
                print(f"  Target (TDEE + goal adjustment): {target_calories_for_adjustment}")
                print(f"  Current total: {total_current_calories}")
                print(f"  Difference: {difference}")
                
                # Only adjust if difference is significant (more than tolerance)
                if abs(difference) > tolerance and total_current_calories > 0:
                    print(f"🔧 GET - Adjusting selections to match target calories (TDEE + goal adjustment)...")
                    print(f"🔧 GET - Adjustment factor: {round(target_calories_for_adjustment / total_current_calories, 3)}")
                    adjustment_factor = target_calories_for_adjustment / total_current_calories
                    
                    # Apply adjustment to each selection's ingredients
                    adjusted_meals_count = 0
                    for selection in selections_data:
                        ingredients = selection.get('ingredients', [])
                        if ingredients and len(ingredients) > 0:
                            adjusted_meals_count += 1
                            # Adjust each ingredient's amount proportionally
                            for ingredient in ingredients:
                                current_amount = ingredient.get('amount', 0) or ingredient.get('quantity', 0)
                                if current_amount > 0:
                                    # Get original amount (before any previous adjustments)
                                    # If original_amount is not set, use current_amount as the baseline
                                    original_amount = ingredient.get('original_amount') or current_amount
                                    # Store original_amount if not already stored
                                    if 'original_amount' not in ingredient:
                                        ingredient['original_amount'] = original_amount
                                    
                                    # Calculate new amount
                                    new_amount = current_amount * adjustment_factor
                                    
                                    # Safety limits: minimum 1g, maximum 10x original
                                    if new_amount < 1:
                                        new_amount = 1
                                    max_amount = original_amount * 10
                                    if new_amount > max_amount:
                                        new_amount = max_amount
                                    
                                    # Minimum: 10% of original
                                    min_amount = original_amount * 0.1
                                    if new_amount < min_amount and new_amount > 1:
                                        new_amount = max(min_amount, 1)
                                    
                                    ingredient['amount'] = round(new_amount, 1)
                                    
                                    # Recalculate nutrition for this ingredient
                                    calories_per_100g = ingredient.get('calories_per_100g', 0)
                                    
                                    # If calories_per_100g is not available, try to get it from food object or calculate from current values
                                    if calories_per_100g == 0:
                                        # Try to get from food_id
                                        food_id = ingredient.get('food_id')
                                        if food_id:
                                            try:
                                                from .models import Food
                                                food = Food.objects.get(id=food_id)
                                                calories_per_100g = food.calories_per_100g or 0
                                                ingredient['calories_per_100g'] = calories_per_100g
                                                ingredient['protein_per_100g'] = food.protein_per_100g or 0
                                                ingredient['carbs_per_100g'] = food.carbs_per_100g or 0
                                                ingredient['fat_per_100g'] = food.fat_per_100g or 0
                                            except:
                                                pass
                                        
                                        # If still not available, calculate from current calories and amount
                                        if calories_per_100g == 0 and ingredient.get('calories', 0) > 0 and current_amount > 0:
                                            calories_per_100g = (ingredient.get('calories', 0) / current_amount) * 100
                                            ingredient['calories_per_100g'] = calories_per_100g
                                    
                                    if calories_per_100g > 0:
                                        factor = ingredient['amount'] / 100
                                        ingredient['calories'] = round(calories_per_100g * factor, 1)
                                        ingredient['protein'] = round(ingredient.get('protein_per_100g', 0) * factor, 1)
                                        ingredient['carbs'] = round(ingredient.get('carbs_per_100g', 0) * factor, 1)
                                        ingredient['fat'] = round(ingredient.get('fat_per_100g', 0) * factor, 1)
                            
                            # Recalculate meal nutrition from adjusted ingredients
                            meal_calories = sum(ing.get('calories', 0) for ing in ingredients)
                            meal_protein = sum(ing.get('protein', 0) for ing in ingredients)
                            meal_carbs = sum(ing.get('carbs', 0) for ing in ingredients)
                            meal_fat = sum(ing.get('fat', 0) for ing in ingredients)
                            
                            # Update selection with recalculated values
                            selection['calories'] = round(meal_calories, 1)
                            selection['nutrition_info'] = {
                                'calories': round(meal_calories, 1),
                                'protein': round(meal_protein, 1),
                                'carbs': round(meal_carbs, 1),
                                'fat': round(meal_fat, 1)
                            }
                    
                    # Recalculate total after adjustment
                    total_after_adjustment = sum(sel.get('calories', 0) for sel in selections_data)
                    final_difference = abs(total_after_adjustment - target_calories_for_adjustment)
                    print(f"✅ GET - After adjustment:")
                    print(f"  Adjusted meals: {adjusted_meals_count} out of {len(selections_data)}")
                    print(f"  Total calories: {round(total_after_adjustment)}")
                    print(f"  Target calories: {target_calories_for_adjustment}")
                    print(f"  Difference: {round(final_difference)}")
                    
                    # Keep adjusting until we reach the target (within tolerance)
                    # Maximum 5 iterations to avoid infinite loops
                    max_iterations = 5
                    iteration = 0
                    current_total = total_after_adjustment
                    current_diff = final_difference
                    
                    while current_diff > tolerance and iteration < max_iterations and current_total > 0:
                        iteration += 1
                        print(f"⚠️ GET - Iteration {iteration}: Still not within tolerance (diff: {round(current_diff)}), trying another adjustment...")
                        additional_factor = target_calories_for_adjustment / current_total
                        
                        # Safety limit: allow up to 2x adjustment per iteration
                        if 0.5 <= additional_factor <= 2.0:
                            print(f"🔧 GET - Iteration {iteration} adjustment factor: {round(additional_factor, 3)}")
                            for selection in selections_data:
                                ingredients = selection.get('ingredients', [])
                                if ingredients and len(ingredients) > 0:
                                    for ingredient in ingredients:
                                        current_amount = ingredient.get('amount', 0)
                                        if current_amount > 0:
                                            new_amount = current_amount * additional_factor
                                            original_amount = ingredient.get('original_amount', current_amount)
                                            
                                            # Safety limits
                                            if new_amount < 1:
                                                new_amount = 1
                                            max_amount = original_amount * 10
                                            if new_amount > max_amount:
                                                new_amount = max_amount
                                            min_amount = original_amount * 0.1
                                            if new_amount < min_amount and new_amount > 1:
                                                new_amount = max(min_amount, 1)
                                            
                                            ingredient['amount'] = round(new_amount, 1)
                                            
                                            # Recalculate nutrition
                                            calories_per_100g = ingredient.get('calories_per_100g', 0)
                                            if calories_per_100g > 0:
                                                factor = ingredient['amount'] / 100
                                                ingredient['calories'] = round(calories_per_100g * factor, 1)
                                                ingredient['protein'] = round(ingredient.get('protein_per_100g', 0) * factor, 1)
                                                ingredient['carbs'] = round(ingredient.get('carbs_per_100g', 0) * factor, 1)
                                                ingredient['fat'] = round(ingredient.get('fat_per_100g', 0) * factor, 1)
                                    
                                    # Recalculate meal nutrition
                                    meal_calories = sum(ing.get('calories', 0) for ing in ingredients)
                                    meal_protein = sum(ing.get('protein', 0) for ing in ingredients)
                                    meal_carbs = sum(ing.get('carbs', 0) for ing in ingredients)
                                    meal_fat = sum(ing.get('fat', 0) for ing in ingredients)
                                    
                                    selection['calories'] = round(meal_calories, 1)
                                    selection['nutrition_info'] = {
                                        'calories': round(meal_calories, 1),
                                        'protein': round(meal_protein, 1),
                                        'carbs': round(meal_carbs, 1),
                                        'fat': round(meal_fat, 1)
                                    }
                            
                            # Recalculate total
                            current_total = sum(sel.get('calories', 0) for sel in selections_data)
                            current_diff = abs(current_total - target_calories_for_adjustment)
                            print(f"✅ GET - After iteration {iteration}: Total: {round(current_total)}, Target: {target_calories_for_adjustment}, Difference: {round(current_diff)}")
                        else:
                            print(f"⚠️ GET - Adjustment factor {round(additional_factor, 3)} outside safety limits (0.5-2.0), stopping iterations")
                            break
                    
                    if current_diff <= tolerance:
                        print(f"✅ GET - Successfully adjusted to target! Final difference: {round(current_diff)}")
                    else:
                        print(f"⚠️ GET - Could not reach target after {iteration} iterations. Final difference: {round(current_diff)}")
                else:
                    print(f"✅ GET - No adjustment needed. Total calories ({round(total_current_calories)}) is within tolerance of target ({target_calories_for_adjustment})")
            
            # Return selections with required calories info
            print(f"📊 GET Response - Total unique selections: {len(selections_data)}")
            print(f"📊 GET Response - Selections IDs: {[s.get('id') for s in selections_data]}")
            print(f"📊 GET Response - Selections names: {[s.get('meal_name') for s in selections_data]}")
            
            response_data = {
                'selections': selections_data,
                'required_calories': required_calories,
                'total_meals': len(selections_data)
            }
            
            return Response(response_data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, patient_id):
        """
        حفظ الوجبات المختارة للمريض مع تعديل المكونات تلقائياً لتطابق السعرات المطلوبة
        
        كيفية ربط المكونات بالسعرات الحرارية للمريض:
        ============================================
        
        1. حساب السعرات المطلوبة:
           - من ملف المريض (PatientProfile.daily_calories)
           - أو من خطة الوجبات (MealPlan.target_calories)
        
        2. حساب السعرات الحالية:
           - جمع سعرات جميع الوجبات المختارة
        
        3. حساب عامل التعديل:
           - عامل التعديل = السعرات المطلوبة / السعرات الحالية
           - مثال: إذا كانت المطلوبة 2000 والحالية 1500، العامل = 1.33
        
        4. تعديل كل مكون:
           - الكمية الجديدة = الكمية الأصلية × عامل التعديل
           - مثال: مكون 100g × 1.33 = 133g
        
        5. إعادة حساب القيم الغذائية:
           - لكل مكون: السعرات = (السعرات لكل 100g × الكمية الجديدة) / 100
           - جمع سعرات جميع المكونات = سعرات الوجبة
        
        6. التحقق من التطابق:
           - المجموع الكلي يجب أن يطابق السعرات المطلوبة (مع هامش خطأ 5 سعرات)
        """
        try:
            print(f"📥 POST Request received for patient {patient_id}")
            print(f"📥 User: {request.user.username} (role: {request.user.role})")
            print(f"📥 Request data keys: {list(request.data.keys())}")
            
            # Check permissions
            if request.user.role == 'patient' and str(request.user.id) != str(patient_id):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            elif request.user.role not in ['patient', 'doctor', 'admin']:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
            meal_plan_id = request.data.get('meal_plan_id')
            selected_meals = request.data.get('selected_meals', [])
            
            print(f"📥 Meal plan ID: {meal_plan_id}")
            print(f"📥 Selected meals count: {len(selected_meals) if selected_meals else 0}")
            
            if not meal_plan_id:
                return Response({'error': 'meal_plan_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not selected_meals:
                return Response({'error': 'No meals selected'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Log first meal structure for debugging
            if selected_meals and len(selected_meals) > 0:
                print(f"📥 First meal structure: {list(selected_meals[0].keys())}")
                if 'ingredients' in selected_meals[0]:
                    print(f"📥 First meal ingredients count: {len(selected_meals[0].get('ingredients', []))}")
                    if selected_meals[0].get('ingredients') and len(selected_meals[0].get('ingredients', [])) > 0:
                        print(f"📥 First ingredient structure: {list(selected_meals[0]['ingredients'][0].keys())}")
            
            # Import models
            from .models import PatientMealSelection, MealPlan
            from accounts.models import User
            
            # Get patient and meal plan
            try:
                patient = User.objects.get(id=patient_id)
                meal_plan = MealPlan.objects.get(id=meal_plan_id, patient=patient)
            except (User.DoesNotExist, MealPlan.DoesNotExist):
                return Response({'error': 'Invalid patient or meal plan'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get patient profile to check required calories
            from accounts.models import PatientProfile
            try:
                patient_profile = PatientProfile.objects.get(user=patient)
                
                # استخدام السعرات اليومية المحسوبة (TDEE + goal adjustment) كالسعرات المطلوبة
                # هذا هو نفس الحساب في صفحة الطبيب: السعرات اليومية المحسوبة
                daily_calories = patient_profile.calculate_daily_calories(force_recalculate=True)
                required_calories = daily_calories  # السعرات المطلوبة = السعرات اليومية المحسوبة
                
                # حساب TDEE و goal adjustment للاستخدام في السجلات
                tdee = patient_profile.calculate_tdee()
                goal_adjustments = {
                    'lose_weight': -500,
                    'gain_weight': 500,
                    'build_muscle': 300,
                    'maintain_weight': 0,
                    'improve_health': 0
                }
                goal_adjustment = goal_adjustments.get(patient_profile.goal, 0)
                
                # السعرات المستهدفة لتعديل المكونات = نفس السعرات المطلوبة (لا حاجة لتعديل إضافي)
                target_calories_for_adjustment = required_calories
                
                print(f"📊 POST - Required calories (Daily calories = TDEE + goal adjustment): {required_calories}")
                print(f"📊 POST - TDEE: {tdee}, Goal: {patient_profile.goal}, Adjustment: {goal_adjustment}")
                print(f"📊 POST - Target for meal adjustment: {target_calories_for_adjustment} (same as required)")
                
                # حفظ السعرات اليومية المحسوبة في daily_calories
                if required_calories and patient_profile.daily_calories != required_calories:
                    patient_profile.daily_calories = required_calories
                    patient_profile.save()
                    print(f"✅ Updated daily calories (calculated): {required_calories}")
                    
            except PatientProfile.DoesNotExist:
                required_calories = None
                goal_adjustment = 0
                # If no profile, try to get from meal plan
                if meal_plan.target_calories:
                    required_calories = meal_plan.target_calories
                    target_calories_for_adjustment = required_calories
            
            # Calculate total calories from selected meals (before adjustment)
            original_total_calories = 0
            for meal in selected_meals:
                meal_calories = meal.get('nutrition_info', {}).get('calories', 0)
                original_total_calories += meal_calories
            
            # السعرات المستهدفة لتعديل المكونات = نفس السعرات المطلوبة (Daily calories = TDEE + goal adjustment)
            target_calories_for_adjustment = required_calories
            
            print(f"📊 Calories Summary:")
            print(f"  Required (Daily calories = TDEE + goal adjustment): {required_calories if required_calories else 'N/A'}")
            print(f"  Target for meal adjustment: {target_calories_for_adjustment}")
            print(f"  Selected meals total: {original_total_calories}")
            if target_calories_for_adjustment:
                print(f"  Difference: {target_calories_for_adjustment - original_total_calories}")
            
            # Adjust ingredients to match required calories (Daily calories = TDEE + goal adjustment)
            # السعرات المطلوبة للعرض = السعرات اليومية المحسوبة (TDEE + goal adjustment)
            # السعرات المستهدفة لتعديل المكونات = نفس السعرات المطلوبة
            if target_calories_for_adjustment and target_calories_for_adjustment > 0:
                tolerance = 5  # Allow only 5 calories difference for precision
                difference = target_calories_for_adjustment - original_total_calories
                
                print(f"🔧 Adjustment Strategy:")
                print(f"  Required (TDEE for display): {required_calories}")
                print(f"  Target (TDEE + goal adjustment): {target_calories_for_adjustment}")
                print(f"  Current total: {original_total_calories}")
                print(f"  Difference: {difference} calories")
                
                # Always adjust ingredients if there's any significant difference
                # This ensures total calories match required calories exactly
                if abs(difference) > tolerance and original_total_calories > 0:
                    # Calculate adjustment factor (proportional adjustment)
                    # This factor will be applied to all ingredients to scale them up or down
                    if original_total_calories > 0:
                        adjustment_factor = target_calories_for_adjustment / original_total_calories
                    else:
                        adjustment_factor = 1.0
                    
                    print(f"  Adjustment factor: {round(adjustment_factor, 3)} (multiply all ingredients by this factor)")
                    
                    # Get patient profile for intelligent adjustment based on goals
                    patient_profile = None
                    try:
                        from accounts.models import PatientProfile
                        patient_profile = PatientProfile.objects.filter(user=patient).first()
                    except:
                        pass
                    
                    # Adjust each meal's ingredients
                    for meal in selected_meals:
                        ingredients = meal.get('ingredients', [])
                        if ingredients and len(ingredients) > 0:
                            # Adjust each ingredient's amount proportionally
                            # كل مكون يتم تعديله بنفس العامل النسبي لضمان التناسق
                            for ingredient in ingredients:
                                original_amount = ingredient.get('amount', 0)
                                # Store original amount for safety checks
                                if 'original_amount' not in ingredient:
                                    ingredient['original_amount'] = original_amount
                                
                                if original_amount > 0:
                                    # Get nutrition data from ingredient or fetch from database
                                    calories_per_100g = ingredient.get('calories_per_100g', 0)
                                    protein_per_100g = ingredient.get('protein_per_100g', 0)
                                    carbs_per_100g = ingredient.get('carbs_per_100g', 0)
                                    fat_per_100g = ingredient.get('fat_per_100g', 0)
                                    
                                    # If nutrition data is missing, try to get from Food model
                                    if calories_per_100g == 0:
                                        food_id = ingredient.get('food_id') or ingredient.get('id')
                                        food_name = ingredient.get('food_name') or ingredient.get('food_name_ar') or ingredient.get('name')
                                        
                                        if food_id:
                                            try:
                                                from .models import Food
                                                food = Food.objects.get(id=food_id)
                                                calories_per_100g = food.calories_per_100g
                                                protein_per_100g = food.protein_per_100g
                                                carbs_per_100g = food.carbs_per_100g
                                                fat_per_100g = food.fat_per_100g
                                            except Food.DoesNotExist:
                                                pass
                                        elif food_name:
                                            try:
                                                from .models import Food
                                                food = Food.objects.filter(
                                                    Q(name=food_name) | Q(name_ar=food_name)
                                                ).first()
                                                if food:
                                                    calories_per_100g = food.calories_per_100g
                                                    protein_per_100g = food.protein_per_100g
                                                    carbs_per_100g = food.carbs_per_100g
                                                    fat_per_100g = food.fat_per_100g
                                            except:
                                                pass
                                    
                                    # If we still don't have nutrition data, calculate from current calories
                                    if calories_per_100g == 0 and ingredient.get('calories', 0) > 0:
                                        # Estimate calories_per_100g from current amount and calories
                                        current_calories = ingredient.get('calories', 0)
                                        if original_amount > 0:
                                            calories_per_100g = (current_calories / original_amount) * 100
                                            # Estimate other nutrients proportionally
                                            current_protein = ingredient.get('protein', 0)
                                            current_carbs = ingredient.get('carbs', 0)
                                            current_fat = ingredient.get('fat', 0)
                                            if original_amount > 0:
                                                protein_per_100g = (current_protein / original_amount) * 100
                                                carbs_per_100g = (current_carbs / original_amount) * 100
                                                fat_per_100g = (current_fat / original_amount) * 100
                                    
                                    # ===== تعديل كمية المكون بشكل نسبي =====
                                    # الخطوة 1: حساب الكمية الجديدة = الكمية الأصلية × عامل التعديل
                                    # مثال: إذا كان المكون 100g والسعرات المطلوبة ضعف الحالية،
                                    #        عامل التعديل = 2.0، الكمية الجديدة = 100 × 2 = 200g
                                    new_amount = original_amount * adjustment_factor
                                    
                                    # الخطوة 2: فحوصات الأمان - ضمان أن الكمية معقولة
                                    # - الحد الأدنى: 1 جرام على الأقل
                                    if new_amount < 1:
                                        new_amount = 1
                                    
                                    # - الحد الأقصى: لا تزيد عن 10 أضعاف الكمية الأصلية
                                    #   (زيادة من 3x إلى 10x لضمان التعديل حتى مع الفروقات الكبيرة مثل 1576 → 2000)
                                    #   هذا يسمح بتعديل يصل إلى 10x للتأكد من تطابق السعرات المطلوبة
                                    max_amount = original_amount * 10
                                    if new_amount > max_amount:
                                        new_amount = max_amount
                                        print(f"⚠️ Limited ingredient amount increase for safety: {ingredient.get('food_name', 'Unknown')} from {original_amount}g to {new_amount}g")
                                    
                                    # - الحد الأدنى للتخفيض: لا تقل عن 10% من الكمية الأصلية (للمحافظة على القيمة الغذائية)
                                    min_amount = original_amount * 0.1
                                    if new_amount < min_amount and new_amount > 1:
                                        new_amount = max(min_amount, 1)
                                        print(f"⚠️ Limited ingredient amount decrease for safety: {ingredient.get('food_name', 'Unknown')} from {original_amount}g to {new_amount}g")
                                    
                                    # الخطوة 3: حفظ الكمية الجديدة (مقربة إلى منزلة عشرية واحدة)
                                    ingredient['amount'] = round(new_amount, 1)
                                    print(f"📝 Adjusted ingredient: {ingredient.get('food_name', 'Unknown')} - {original_amount}g → {ingredient['amount']}g (factor: {round(adjustment_factor, 2)})")
                                    
                                    # الخطوة 4: حفظ القيم الغذائية لكل 100 جرام (للاستخدام في الحسابات المستقبلية)
                                    if calories_per_100g > 0:
                                        ingredient['calories_per_100g'] = calories_per_100g
                                        ingredient['protein_per_100g'] = protein_per_100g
                                        ingredient['carbs_per_100g'] = carbs_per_100g
                                        ingredient['fat_per_100g'] = fat_per_100g
                                    
                                    # الخطوة 5: إعادة حساب القيم الغذائية للمكون بالكمية الجديدة
                                    # الصيغة: القيمة الغذائية = (القيمة لكل 100g × الكمية الجديدة) / 100
                                    if calories_per_100g > 0:
                                        factor = new_amount / 100
                                        ingredient['calories'] = round(calories_per_100g * factor, 1)
                                        ingredient['protein'] = round(protein_per_100g * factor, 1)
                                        ingredient['carbs'] = round(carbs_per_100g * factor, 1)
                                        ingredient['fat'] = round(fat_per_100g * factor, 1)
                            
                            # ===== إعادة حساب القيم الغذائية للوجبة بعد تعديل المكونات =====
                            # الخطوة 1: جمع جميع القيم الغذائية من المكونات المدورة
                            # هذا يضمن أن المجموع الكلي يطابق مجموع المكونات المعروضة تماماً
                            meal_calories = sum(ing.get('calories', 0) for ing in ingredients)
                            meal_protein = sum(ing.get('protein', 0) for ing in ingredients)
                            meal_carbs = sum(ing.get('carbs', 0) for ing in ingredients)
                            meal_fat = sum(ing.get('fat', 0) for ing in ingredients)
                            
                            # الخطوة 2: تقريب المجاميع لضمان التناسق مع تقريب المكونات
                            final_meal_calories = round(meal_calories, 1)
                            final_meal_protein = round(meal_protein, 1)
                            final_meal_carbs = round(meal_carbs, 1)
                            final_meal_fat = round(meal_fat, 1)
                            
                            # الخطوة 3: تحديث معلومات التغذية للوجبة بالقيم التي تطابق مجموع المكونات
                            if 'nutrition_info' not in meal:
                                meal['nutrition_info'] = {}
                            meal['nutrition_info']['calories'] = final_meal_calories
                            meal['nutrition_info']['protein'] = final_meal_protein
                            meal['nutrition_info']['carbs'] = final_meal_carbs
                            meal['nutrition_info']['fat'] = final_meal_fat
                            
                            # الخطوة 4: إضافة حقل السعرات مباشرة للوجبة لضمان التناسق
                            meal['calories'] = final_meal_calories
                    
                    # Recalculate total calories after adjustment
                    total_calories = sum(meal.get('nutrition_info', {}).get('calories', 0) for meal in selected_meals)
                    current_difference = required_calories - total_calories
                    print(f"✅ Adjusted ingredients. New total calories: {round(total_calories)}, Required: {required_calories}, Difference: {round(current_difference)}")
                    
                    # Store adjustment info for response
                    adjustment_info = {
                        'adjusted': True,
                        'original_calories': round(original_total_calories),
                        'adjusted_calories': round(total_calories),
                        'required_calories': required_calories,
                        'adjustment_factor': round(adjustment_factor, 2)
                    }
                else:
                    # No adjustment needed, but still set total_calories
                    total_calories = original_total_calories
                    if required_calories:
                        print(f"ℹ️ No adjustment needed. Total calories: {round(total_calories)}, Target: {target_calories_for_adjustment}, Difference: {round(target_calories_for_adjustment - total_calories)}")
                
                # Final validation after adjustment
                # Recalculate total calories to ensure accuracy
                total_calories = sum(meal.get('nutrition_info', {}).get('calories', 0) for meal in selected_meals)
                final_difference = abs(total_calories - target_calories_for_adjustment)
                
                print(f"📊 After adjustment - Total: {round(total_calories)}, Target: {target_calories_for_adjustment}, Difference: {round(final_difference)}")
                
                # If still not within tolerance after adjustment, try one more fine-tuning
                if final_difference > tolerance and 'adjustment_info' in locals() and adjustment_info.get('adjusted'):
                    # Calculate additional adjustment needed
                    if total_calories > 0:
                        additional_factor = target_calories_for_adjustment / total_calories
                        # Apply additional fine-tuning (limit to small adjustments to avoid over-correction)
                        # Allow up to 10% adjustment for fine-tuning (safer than 5%)
                        if 0.9 <= additional_factor <= 1.1:  # Only adjust if within 10% difference
                            for meal in selected_meals:
                                ingredients = meal.get('ingredients', [])
                                if ingredients and len(ingredients) > 0:
                                    for ingredient in ingredients:
                                        current_amount = ingredient.get('amount', 0)
                                        if current_amount > 0:
                                            ingredient['amount'] = round(current_amount * additional_factor, 1)
                                            # Recalculate nutrition
                                            calories_per_100g = ingredient.get('calories_per_100g', 0)
                                            if calories_per_100g > 0:
                                                factor = ingredient['amount'] / 100
                                                ingredient['calories'] = round(calories_per_100g * factor, 1)
                                                ingredient['protein'] = round(ingredient.get('protein_per_100g', 0) * factor, 1)
                                                ingredient['carbs'] = round(ingredient.get('carbs_per_100g', 0) * factor, 1)
                                                ingredient['fat'] = round(ingredient.get('fat_per_100g', 0) * factor, 1)
                                    # Recalculate meal nutrition from rounded ingredient values
                                    meal_calories = sum(ing.get('calories', 0) for ing in ingredients)
                                    meal_protein = sum(ing.get('protein', 0) for ing in ingredients)
                                    meal_carbs = sum(ing.get('carbs', 0) for ing in ingredients)
                                    meal_fat = sum(ing.get('fat', 0) for ing in ingredients)
                                    
                                    # Update nutrition_info with values that match sum of ingredients
                                    meal['nutrition_info']['calories'] = round(meal_calories, 1)
                                    meal['nutrition_info']['protein'] = round(meal_protein, 1)
                                    meal['nutrition_info']['carbs'] = round(meal_carbs, 1)
                                    meal['nutrition_info']['fat'] = round(meal_fat, 1)
                                    meal['calories'] = round(meal_calories, 1)
                            
                            # Recalculate total again
                            total_calories = sum(meal.get('nutrition_info', {}).get('calories', 0) for meal in selected_meals)
                            final_difference = abs(total_calories - target_calories_for_adjustment)
                            print(f"✅ Fine-tuned adjustment. Final total calories: {round(total_calories)}, Target: {target_calories_for_adjustment}, Difference: {round(final_difference)}")
                
                # If still not within tolerance, try one more aggressive adjustment (safely)
                if final_difference > tolerance:
                    # Try one more adjustment with more aggressive factor
                    if total_calories > 0:
                        final_adjustment_factor = target_calories_for_adjustment / total_calories
                        # Apply final adjustment (allow up to 15% adjustment for final tuning - safer than 20%)
                        if 0.85 <= final_adjustment_factor <= 1.15:
                            print(f"🔧 Applying final adjustment with factor: {round(final_adjustment_factor, 2)}")
                            for meal in selected_meals:
                                ingredients = meal.get('ingredients', [])
                                if ingredients and len(ingredients) > 0:
                                    for ingredient in ingredients:
                                        current_amount = ingredient.get('amount', 0)
                                        if current_amount > 0:
                                            # Apply adjustment with safety limits
                                            adjusted_amount = current_amount * final_adjustment_factor
                                            # Ensure minimum 1g and maximum 3x original
                                            original_original_amount = ingredient.get('original_amount', current_amount)
                                            if adjusted_amount < 1:
                                                adjusted_amount = 1
                                            max_safe_amount = original_original_amount * 3
                                            if adjusted_amount > max_safe_amount:
                                                adjusted_amount = max_safe_amount
                                            
                                            ingredient['amount'] = round(adjusted_amount, 1)
                                            # Recalculate nutrition
                                            calories_per_100g = ingredient.get('calories_per_100g', 0)
                                            if calories_per_100g > 0:
                                                factor = ingredient['amount'] / 100
                                                ingredient['calories'] = round(calories_per_100g * factor, 1)
                                                ingredient['protein'] = round(ingredient.get('protein_per_100g', 0) * factor, 1)
                                                ingredient['carbs'] = round(ingredient.get('carbs_per_100g', 0) * factor, 1)
                                                ingredient['fat'] = round(ingredient.get('fat_per_100g', 0) * factor, 1)
                                    # Recalculate meal nutrition from rounded ingredient values
                                    meal_calories = sum(ing.get('calories', 0) for ing in ingredients)
                                    meal_protein = sum(ing.get('protein', 0) for ing in ingredients)
                                    meal_carbs = sum(ing.get('carbs', 0) for ing in ingredients)
                                    meal_fat = sum(ing.get('fat', 0) for ing in ingredients)
                                    
                                    # Update nutrition_info with values that match sum of ingredients exactly
                                    final_meal_calories = round(meal_calories, 1)
                                    final_meal_protein = round(meal_protein, 1)
                                    final_meal_carbs = round(meal_carbs, 1)
                                    final_meal_fat = round(meal_fat, 1)
                                    
                                    meal['nutrition_info']['calories'] = final_meal_calories
                                    meal['nutrition_info']['protein'] = final_meal_protein
                                    meal['nutrition_info']['carbs'] = final_meal_carbs
                                    meal['nutrition_info']['fat'] = final_meal_fat
                                    meal['calories'] = final_meal_calories
                            
                            # Recalculate total one more time
                            total_calories = sum(meal.get('nutrition_info', {}).get('calories', 0) for meal in selected_meals)
                            final_difference = abs(total_calories - target_calories_for_adjustment)
                            print(f"✅ Final safe adjustment. Total calories: {round(total_calories)}, Target: {target_calories_for_adjustment}, Difference: {round(final_difference)}")
                
                # Final check - if still not within tolerance after all adjustments
                # Keep adjusting until we reach the target (within tolerance)
                # Maximum 5 iterations to avoid infinite loops
                max_iterations = 5
                iteration = 0
                current_total = total_calories
                current_diff = final_difference
                
                while current_diff > tolerance and iteration < max_iterations and current_total > 0:
                    iteration += 1
                    print(f"⚠️ POST - Iteration {iteration}: Still not within tolerance (diff: {round(current_diff)}), trying another adjustment...")
                    adjustment_factor = target_calories_for_adjustment / current_total
                    
                    # Safety limit: allow up to 2x adjustment per iteration
                    if 0.5 <= adjustment_factor <= 2.0:
                        print(f"🔧 POST - Iteration {iteration} adjustment factor: {round(adjustment_factor, 3)}")
                        for meal in selected_meals:
                            ingredients = meal.get('ingredients', [])
                            if ingredients and len(ingredients) > 0:
                                for ingredient in ingredients:
                                    current_amount = ingredient.get('amount', 0)
                                    if current_amount > 0:
                                        new_amount = current_amount * adjustment_factor
                                        original_amount = ingredient.get('original_amount', current_amount)
                                        
                                        # Safety limits
                                        if new_amount < 1:
                                            new_amount = 1
                                        max_amount = original_amount * 10
                                        if new_amount > max_amount:
                                            new_amount = max_amount
                                        min_amount = original_amount * 0.1
                                        if new_amount < min_amount and new_amount > 1:
                                            new_amount = max(min_amount, 1)
                                        
                                        ingredient['amount'] = round(new_amount, 1)
                                        
                                        # Recalculate nutrition
                                        calories_per_100g = ingredient.get('calories_per_100g', 0)
                                        if calories_per_100g > 0:
                                            factor = ingredient['amount'] / 100
                                            ingredient['calories'] = round(calories_per_100g * factor, 1)
                                            ingredient['protein'] = round(ingredient.get('protein_per_100g', 0) * factor, 1)
                                            ingredient['carbs'] = round(ingredient.get('carbs_per_100g', 0) * factor, 1)
                                            ingredient['fat'] = round(ingredient.get('fat_per_100g', 0) * factor, 1)
                                
                                # Recalculate meal nutrition
                                meal_calories = sum(ing.get('calories', 0) for ing in ingredients)
                                meal_protein = sum(ing.get('protein', 0) for ing in ingredients)
                                meal_carbs = sum(ing.get('carbs', 0) for ing in ingredients)
                                meal_fat = sum(ing.get('fat', 0) for ing in ingredients)
                                
                                meal['nutrition_info']['calories'] = round(meal_calories, 1)
                                meal['nutrition_info']['protein'] = round(meal_protein, 1)
                                meal['nutrition_info']['carbs'] = round(meal_carbs, 1)
                                meal['nutrition_info']['fat'] = round(meal_fat, 1)
                                meal['calories'] = round(meal_calories, 1)
                        
                        # Recalculate total
                        current_total = sum(meal.get('nutrition_info', {}).get('calories', 0) for meal in selected_meals)
                        current_diff = abs(current_total - target_calories_for_adjustment)
                        print(f"✅ POST - After iteration {iteration}: Total: {round(current_total)}, Target: {target_calories_for_adjustment}, Difference: {round(current_diff)}")
                    else:
                        print(f"⚠️ POST - Adjustment factor {round(adjustment_factor, 3)} outside safety limits (0.5-2.0), trying aggressive adjustment...")
                        # Try aggressive adjustment if normal adjustment is outside limits
                        if 0.1 <= adjustment_factor <= 10:
                            print(f"🔧 POST - Applying aggressive adjustment with factor: {round(adjustment_factor, 3)}")
                            for meal in selected_meals:
                                ingredients = meal.get('ingredients', [])
                                if ingredients and len(ingredients) > 0:
                                    for ingredient in ingredients:
                                        current_amount = ingredient.get('amount', 0)
                                        if current_amount > 0:
                                            # Apply aggressive adjustment
                                            aggressive_amount = current_amount * adjustment_factor
                                            # Get original amount for safety limits
                                            original_original_amount = ingredient.get('original_amount', current_amount)
                                            
                                            # Safety limits: minimum 1g, maximum 10x original (same as initial adjustment)
                                            if aggressive_amount < 1:
                                                aggressive_amount = 1
                                            max_aggressive_amount = original_original_amount * 10
                                            if aggressive_amount > max_aggressive_amount:
                                                aggressive_amount = max_aggressive_amount
                                            
                                            # Minimum: 10% of original (same as initial adjustment)
                                            min_aggressive_amount = original_original_amount * 0.1
                                            if aggressive_amount < min_aggressive_amount and aggressive_amount > 1:
                                                aggressive_amount = max(min_aggressive_amount, 1)
                                            
                                            ingredient['amount'] = round(aggressive_amount, 1)
                                            
                                            # Recalculate nutrition
                                            calories_per_100g = ingredient.get('calories_per_100g', 0)
                                            if calories_per_100g > 0:
                                                factor = ingredient['amount'] / 100
                                                ingredient['calories'] = round(calories_per_100g * factor, 1)
                                                ingredient['protein'] = round(ingredient.get('protein_per_100g', 0) * factor, 1)
                                                ingredient['carbs'] = round(ingredient.get('carbs_per_100g', 0) * factor, 1)
                                                ingredient['fat'] = round(ingredient.get('fat_per_100g', 0) * factor, 1)
                                    
                                    # Recalculate meal nutrition
                                    meal_calories = sum(ing.get('calories', 0) for ing in ingredients)
                                    meal_protein = sum(ing.get('protein', 0) for ing in ingredients)
                                    meal_carbs = sum(ing.get('carbs', 0) for ing in ingredients)
                                    meal_fat = sum(ing.get('fat', 0) for ing in ingredients)
                                    
                                    meal['nutrition_info']['calories'] = round(meal_calories, 1)
                                    meal['nutrition_info']['protein'] = round(meal_protein, 1)
                                    meal['nutrition_info']['carbs'] = round(meal_carbs, 1)
                                    meal['nutrition_info']['fat'] = round(meal_fat, 1)
                                    meal['calories'] = round(meal_calories, 1)
                            
                            # Recalculate total
                            current_total = sum(meal.get('nutrition_info', {}).get('calories', 0) for meal in selected_meals)
                            current_diff = abs(current_total - target_calories_for_adjustment)
                            print(f"✅ POST - After aggressive adjustment: Total: {round(current_total)}, Target: {target_calories_for_adjustment}, Difference: {round(current_diff)}")
                        else:
                            print(f"⚠️ POST - Adjustment factor {round(adjustment_factor, 3)} outside all safety limits, stopping iterations")
                            break
                
                if current_diff <= tolerance:
                    print(f"✅ POST - Successfully adjusted to target! Final difference: {round(current_diff)}")
                    total_calories = current_total
                    final_difference = current_diff
                else:
                    print(f"⚠️ POST - Could not reach target after {iteration} iterations. Final difference: {round(current_diff)}")
                    total_calories = current_total
                    final_difference = current_diff
                
                # Final check - if still not within tolerance after all attempts, return error
                if final_difference > tolerance:
                    if total_calories < target_calories_for_adjustment:
                        error_msg = f'السعرات الحرارية أقل من المطلوب بعد التعديل! المطلوب: {target_calories_for_adjustment} سعرة، المختار: {round(total_calories)} سعرة. الفرق: {round(target_calories_for_adjustment - total_calories)} سعرة. يرجى إضافة وجبات أو مكونات إضافية.'
                    else:
                        error_msg = f'السعرات الحرارية أكثر من المطلوب! المطلوب: {target_calories_for_adjustment} سعرة، المختار: {round(total_calories)} سعرة. الفرق: {round(total_calories - target_calories_for_adjustment)} سعرة. يرجى تقليل الوجبات أو المكونات.'
                    return Response({
                        'error': error_msg,
                        'required_calories': required_calories,  # TDEE للعرض
                        'target_calories': target_calories_for_adjustment,  # TDEE + goal adjustment
                        'total_calories': round(total_calories),
                        'difference': round(final_difference)
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Clear existing selections for this meal plan
            # Delete all selections for this patient and meal plan to avoid duplicates
            try:
                # First, check for and remove any duplicates that might exist
                # (in case there are duplicates from previous saves before we fixed unique_together)
                all_selections = PatientMealSelection.objects.filter(patient=patient, meal_plan=meal_plan).order_by('-selected_at')
                seen_keys = set()
                duplicates_to_delete = []
                
                for sel in all_selections:
                    unique_key = (sel.patient_id, sel.meal_plan_id, sel.meal_name, sel.meal_type)
                    if unique_key in seen_keys:
                        duplicates_to_delete.append(sel.id)
                        print(f"⚠️ Found duplicate selection to delete: {sel.meal_name} ({sel.meal_type})")
                    else:
                        seen_keys.add(unique_key)
                
                if duplicates_to_delete:
                    PatientMealSelection.objects.filter(id__in=duplicates_to_delete).delete()
                    print(f"🗑️ Deleted {len(duplicates_to_delete)} duplicate selections")
                
                # Now delete all remaining selections for this meal plan
                deleted_count = PatientMealSelection.objects.filter(
                    patient=patient, 
                    meal_plan=meal_plan
                ).delete()[0]
                print(f"🗑️ Deleted {deleted_count} existing selections for patient {patient_id}, meal plan {meal_plan_id}")
                    
            except Exception as delete_error:
                print(f"⚠️ Error deleting existing selections: {str(delete_error)}")
                # Continue anyway - might be first time saving
            
            # Save new selections
            created_selections = []
            for meal_index, meal in enumerate(selected_meals):
                print(f"🍽️ Processing meal {meal_index + 1}/{len(selected_meals)}: {meal.get('meal_name', 'Unknown')}")
                # Extract ingredients from meal data
                ingredients = meal.get('ingredients', [])
                print(f"🔍 Backend - Processing meal: {meal.get('meal_name', '')}")
                print(f"🔍 Backend - Ingredients received: {len(ingredients)} items")
                print(f"🔍 Backend - Ingredients data: {ingredients}")
                print(f"🔍 Backend - Ingredients type: {type(ingredients)}")
                if ingredients and len(ingredients) > 0:
                    print(f"🔍 Backend - First ingredient: {ingredients[0]}")
                    print(f"🔍 Backend - First ingredient type: {type(ingredients[0])}")
                
                if not ingredients and meal.get('meal'):
                    # Try to get ingredients from the meal object
                    ingredients = meal.get('meal', {}).get('ingredients', [])
                    print(f"🔍 Backend - Trying alternative ingredients: {len(ingredients)} items")
                
                # Calculate calories from ingredients to ensure accuracy
                # Use the calories field from ingredients (already rounded) to ensure perfect match
                meal_calories_from_ingredients = 0
                meal_protein_from_ingredients = 0
                meal_carbs_from_ingredients = 0
                meal_fat_from_ingredients = 0
                
                if ingredients and len(ingredients) > 0:
                    for ingredient in ingredients:
                        # Use the pre-calculated and rounded values from ingredients
                        # These values were calculated during adjustment and should match exactly
                        ing_calories = ingredient.get('calories', 0)
                        if ing_calories == 0:
                            # Fallback: Calculate from calories_per_100g and amount if calories not set
                            calories_per_100g = ingredient.get('calories_per_100g', 0)
                            amount = ingredient.get('amount', 0)
                            if calories_per_100g > 0 and amount > 0:
                                ing_calories = round((calories_per_100g * amount) / 100, 1)
                        
                        # Use pre-calculated values if available, otherwise calculate
                        ing_protein = ingredient.get('protein', 0)
                        if ing_protein == 0:
                            protein_per_100g = ingredient.get('protein_per_100g', 0)
                            amount = ingredient.get('amount', 0)
                            if protein_per_100g > 0 and amount > 0:
                                ing_protein = round((protein_per_100g * amount) / 100, 1)
                        
                        ing_carbs = ingredient.get('carbs', 0)
                        if ing_carbs == 0:
                            carbs_per_100g = ingredient.get('carbs_per_100g', 0)
                            amount = ingredient.get('amount', 0)
                            if carbs_per_100g > 0 and amount > 0:
                                ing_carbs = round((carbs_per_100g * amount) / 100, 1)
                        
                        ing_fat = ingredient.get('fat', 0)
                        if ing_fat == 0:
                            fat_per_100g = ingredient.get('fat_per_100g', 0)
                            amount = ingredient.get('amount', 0)
                            if fat_per_100g > 0 and amount > 0:
                                ing_fat = round((fat_per_100g * amount) / 100, 1)
                        
                        meal_calories_from_ingredients += ing_calories
                        meal_protein_from_ingredients += ing_protein
                        meal_carbs_from_ingredients += ing_carbs
                        meal_fat_from_ingredients += ing_fat
                
                # Use calculated values from ingredients (sum of rounded values)
                # This ensures the saved calories match the sum of ingredient calories exactly
                final_calories = round(meal_calories_from_ingredients, 1) if meal_calories_from_ingredients > 0 else (meal.get('calories') or meal.get('nutrition_info', {}).get('calories', 0))
                final_protein = round(meal_protein_from_ingredients, 1) if meal_protein_from_ingredients > 0 else (meal.get('nutrition_info', {}).get('protein', 0))
                final_carbs = round(meal_carbs_from_ingredients, 1) if meal_carbs_from_ingredients > 0 else (meal.get('nutrition_info', {}).get('carbs', 0))
                final_fat = round(meal_fat_from_ingredients, 1) if meal_fat_from_ingredients > 0 else (meal.get('nutrition_info', {}).get('fat', 0))
                
                # Ensure ingredients is a valid list/array for JSONField
                # Remove any non-serializable objects and ensure all values are JSON-serializable
                cleaned_ingredients = []
                if ingredients:
                    for ing in ingredients:
                        if isinstance(ing, dict):
                            # Create a clean dictionary with only serializable values
                            clean_ing = {}
                            for key, value in ing.items():
                                # Skip non-serializable objects (like Django model instances)
                                # Check if value is a Django model instance by checking for common model attributes
                                is_model_instance = hasattr(value, 'pk') or hasattr(value, '_meta')
                                if not is_model_instance:
                                    # Convert any other complex types to strings or numbers
                                    if isinstance(value, (int, float, str, bool, type(None))):
                                        clean_ing[key] = value
                                    elif isinstance(value, (list, dict)):
                                        # Recursively clean nested structures
                                        clean_ing[key] = value
                                    else:
                                        # Convert other types to string
                                        clean_ing[key] = str(value)
                                else:
                                    # If it's a model instance, convert to dict or string
                                    if hasattr(value, 'id'):
                                        clean_ing[key] = value.id
                                    else:
                                        clean_ing[key] = str(value)
                            cleaned_ingredients.append(clean_ing)
                        elif isinstance(ing, (int, float, str, bool)):
                            cleaned_ingredients.append(ing)
                        else:
                            # Convert other types to string representation
                            cleaned_ingredients.append(str(ing))
                
                try:
                    selection = PatientMealSelection.objects.create(
                        patient=patient,
                        meal_plan=meal_plan,
                        meal_name=meal.get('meal_name', '') or 'Unknown Meal',
                        meal_type=meal.get('meal_type', '') or 'breakfast',
                        calories=final_calories,
                        protein=final_protein,
                        carbs=final_carbs,
                        fat=final_fat,
                        ingredients=cleaned_ingredients,
                        notes=meal.get('notes', ''),
                        is_confirmed=True
                    )
                    print(f"✅ Created selection: {selection.meal_name} - Calories: {final_calories} (from {len(cleaned_ingredients)} ingredients)")
                        
                except Exception as create_error:
                    import traceback
                    error_traceback = traceback.format_exc()
                    print(f"❌ Error creating PatientMealSelection: {str(create_error)}")
                    print(f"❌ Traceback: {error_traceback}")
                    print(f"❌ Meal data: {meal}")
                    print(f"❌ Ingredients count: {len(cleaned_ingredients)}")
                    # Re-raise to be caught by outer exception handler
                    raise
                
                created_selections.append({
                    'id': selection.id,
                    'meal_name': selection.meal_name,
                    'meal_type': selection.meal_type,
                    'selected_at': selection.selected_at.isoformat(),
                    'calories': final_calories  # Add calories to the response data
                })
            
            # Calculate final total calories from saved selections to verify
            # Use the calories from the response data (dictionaries) not from database objects
            final_total_calories = sum(sel.get('calories', 0) if isinstance(sel, dict) else sel.calories for sel in created_selections)
            final_diff = abs(final_total_calories - required_calories) if required_calories else 0
            print(f"📊 Final verification - Total calories saved: {round(final_total_calories)}, Required: {required_calories if required_calories else 'N/A'}, Difference: {round(final_diff)}")
            
            # Verify that total matches required calories (should be within tolerance after adjustment)
            if required_calories and final_diff > tolerance:
                print(f"⚠️ WARNING: Total calories ({round(final_total_calories)}) does not match required ({required_calories}). Difference: {round(final_diff)}")
                # This should not happen if adjustment worked correctly, but log it for debugging
            
            response_data = {
                'message': f'Successfully saved {len(created_selections)} meal selections',
                'selections': created_selections,
                'total_calories': round(final_total_calories, 1),
                'required_calories': required_calories if required_calories else None,
                'difference': round(final_diff, 1) if required_calories else None
            }
            
            # Add adjustment info if ingredients were adjusted
            if required_calories and required_calories > 0:
                if 'adjustment_info' in locals() and adjustment_info.get('adjusted'):
                    response_data['adjustment_info'] = adjustment_info
                    response_data['message'] += f'. تم تعديل المكونات تلقائياً لتحقيق السعرات المطلوبة ({required_calories} سعرة)'
                    response_data['total_calories'] = round(final_total_calories, 1)
                    response_data['difference'] = round(final_diff, 1)
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            print(f"❌ POST Error in PatientMealSelectionsView: {str(e)}")
            print(f"❌ Traceback: {error_traceback}")
            return Response({
                'error': str(e),
                'detail': error_traceback
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===== حاسبة القيم الغذائية العراقية =====

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def calculate_meal_nutrition_iraqi_api(request, meal_id):
    """حساب القيم الغذائية لوجبة بالطريقة العراقية"""
    try:
        result = calculate_meal_nutrition_iraqi(meal_id)
        if 'error' in result:
            return Response(result, status=status.HTTP_404_NOT_FOUND)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def calculate_recipe_nutrition_iraqi_api(request, recipe_id):
    """حساب القيم الغذائية لوصفة بالطريقة العراقية"""
    try:
        result = calculate_recipe_nutrition_iraqi(recipe_id)
        if 'error' in result:
            return Response(result, status=status.HTTP_404_NOT_FOUND)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def calculate_daily_plan_nutrition_iraqi_api(request, meal_plan_id):
    """حساب القيم الغذائية للخطة اليومية بالطريقة العراقية"""
    try:
        result = calculate_daily_plan_nutrition_iraqi(meal_plan_id)
        if 'error' in result:
            return Response(result, status=status.HTTP_404_NOT_FOUND)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def calculate_custom_nutrition_iraqi_api(request):
    """حساب القيم الغذائية لقائمة مخصصة من الأطعمة"""
    try:
        foods_data = request.data.get('foods', [])
        if not foods_data:
            return Response({'error': 'لم يتم توفير قائمة الأطعمة'}, status=status.HTTP_400_BAD_REQUEST)
        
        calculator = IraqiNutritionCalculator()
        result = calculator.calculate_custom_nutrition(foods_data)
        
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_iraqi_foods_api(request):
    """البحث عن الأطعمة العراقية"""
    try:
        query = request.GET.get('q', '')
        if not query:
            return Response({'error': 'يرجى إدخال كلمة البحث'}, status=status.HTTP_400_BAD_REQUEST)
        
        calculator = IraqiNutritionCalculator()
        foods = calculator.search_iraqi_foods(query)
        
        serializer = FoodSerializer(foods, many=True)
        return Response({
            'foods': serializer.data,
            'count': len(foods),
            'query': query
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_food_suggestions_iraqi_api(request):
    """اقتراحات الأطعمة العراقية"""
    try:
        category = request.GET.get('category', None)
        calculator = IraqiNutritionCalculator()
        foods = calculator.get_food_suggestions(category)
        
        serializer = FoodSerializer(foods, many=True)
        return Response({
            'foods': serializer.data,
            'count': len(foods),
            'category': category
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_nutrition_summary_iraqi_api(request):
    """ملخص القيم الغذائية بالعربية العراقية"""
    try:
        foods_data = request.GET.get('foods', '[]')
        
        import json
        foods_list = json.loads(foods_data)
        
        calculator = IraqiNutritionCalculator()
        result = calculator.calculate_custom_nutrition(foods_list)
        
        summary = calculator.get_nutrition_summary_arabic(result['total_nutrition'])
        
        return Response({
            'summary': summary,
            'total_nutrition': result['total_nutrition'],
            'total_nutrition_arabic': result['total_nutrition_arabic'],
            'foods_count': result['foods_count']
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def compare_nutrition_targets_api(request, meal_plan_id):
    """مقارنة القيم الغذائية الفعلية مع الأهداف"""
    try:
        result = calculate_daily_plan_nutrition_iraqi(meal_plan_id)
        if 'error' in result:
            return Response(result, status=status.HTTP_404_NOT_FOUND)

        comparison = result.get('comparison', {})

        return Response({
            'meal_plan_title': result['plan_title'],
            'actual_nutrition': result['total_nutrition'],
            'target_nutrition': result['targets'],
            'comparison': comparison,
            'overall_status': _get_overall_status(comparison)
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_meal_templates_api(request):
    """الحصول على قوالب الوجبات اليومية"""
    try:
        templates = MealPlanTemplate.objects.filter(is_public=True)
        serializer = MealPlanTemplateSerializer(templates, many=True)
        return Response({
            'templates': serializer.data,
            'count': len(templates)
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_meal_template_details_api(request, template_id):
    """الحصول على تفاصيل قالب وجبات معين"""
    try:
        template = MealPlanTemplate.objects.get(id=template_id, is_public=True)
        serializer = MealPlanTemplateSerializer(template)
        return Response(serializer.data)
    except MealPlanTemplate.DoesNotExist:
        return Response({'error': 'القالب غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_patients_list_api(request):
    """الحصول على قائمة المرضى للطبيب"""
    try:
        from accounts.models import User
        patients = User.objects.filter(role='patient', is_active=True)
        patients_data = []
        for patient in patients:
            patients_data.append({
                'id': patient.id,
                'name': patient.get_full_name() or patient.username,
                'email': patient.email,
                'phone': patient.phone,
                'date_of_birth': patient.date_of_birth
            })
        return Response({
            'patients': patients_data,
            'count': len(patients_data)
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def create_meal_plan_from_template_api(request):
    """إنشاء خطة وجبات من قالب"""
    try:
        template_id = request.data.get('template_id')
        patient_id = request.data.get('patient_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        diet_plan = request.data.get('diet_plan', 'balanced')
        
        print(f"🔍 Debug - Input parameters:")
        print(f"  template_id: {template_id}")
        print(f"  patient_id: {patient_id}")
        print(f"  start_date: {start_date} (type: {type(start_date)})")
        print(f"  end_date: {end_date} (type: {type(end_date)})")
        print(f"  diet_plan: {diet_plan}")
        
        if not all([template_id, patient_id, start_date]):
            return Response({
                'error': 'يرجى توفير معرف القالب ومعرف المريض وتاريخ البداية'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # إنشاء خطة وجبات جديدة من القالب
        template = MealPlanTemplate.objects.get(id=template_id, is_public=True)
        patient = User.objects.get(id=patient_id, role='patient')
        
        # الحصول على طبيب افتراضي إذا لم يكن المستخدم مسجل دخول
        doctor = request.user if request.user.is_authenticated else User.objects.filter(is_staff=True).first()
        
        # حساب تاريخ النهاية
        from datetime import datetime, timedelta
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        if end_date:
            # استخدام تاريخ النهاية المرسل من الـ frontend
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            # حساب تاريخ النهاية (يوم واحد فقط - نفس تاريخ البداية)
            end_date_obj = start_date_obj
        
        meal_plan = MealPlan.objects.create(
            patient=patient,
            doctor=doctor,
            title=f"{template.name_ar} - {start_date}",
            template=template,
            start_date=start_date_obj,
            end_date=end_date_obj,
            diet_plan=diet_plan,
            target_calories=template.target_calories,
            target_protein=template.target_protein_percentage,
            target_carbs=template.target_carbs_percentage,
            target_fat=template.target_fat_percentage,
            status='active'
        )
        
        # إنشاء الوجبات العراقية تلقائياً حسب نوع النظام الغذائي
        print(f"🍽️ إنشاء وجبات عراقية لنظام {diet_plan}")
        
        # الحصول على أنواع الوجبات
        breakfast_type = MealType.objects.get(name='breakfast')
        lunch_type = MealType.objects.get(name='lunch')
        dinner_type = MealType.objects.get(name='dinner')
        snack_type = MealType.objects.get(name='snack')
        
        # Helper function to find food by name
        def get_food_by_name(food_name):
            food = Food.objects.filter(name_ar__icontains=food_name).first()
            if not food:
                food = Food.objects.filter(name__icontains=food_name).first()
            return food
        
        # وجبات عراقية حسب نوع النظام الغذائي
        iraqi_meals_data = []
        
        if diet_plan == 'keto':
            iraqi_meals_data = [
                {
                    'name': 'فطور كيتو تقليدي',
                    'meal_type': breakfast_type,
                    'ingredients': [
                        {'food_ar': 'بيض', 'amount': 100},
                        {'food_ar': 'زيت زيتون', 'amount': 15},
                        {'food_ar': 'جوز', 'amount': 20},
                    ]
                },
                {
                    'name': 'غداء كيتو تقليدي',
                    'meal_type': lunch_type,
                    'ingredients': [
                        {'food_ar': 'لحم', 'amount': 150},
                        {'food_ar': 'خضار مشكلة', 'amount': 200},
                        {'food_ar': 'زيت زيتون', 'amount': 20},
                    ]
                },
                {
                    'name': 'عشاء كيتو تقليدي',
                    'meal_type': dinner_type,
                    'ingredients': [
                        {'food_ar': 'سمك', 'amount': 120},
                        {'food_ar': 'جبن أبيض', 'amount': 60},
                    ]
                },
                {
                    'name': 'وجبة خفيفة كيتو',
                    'meal_type': snack_type,
                    'ingredients': [
                        {'food_ar': 'جوز', 'amount': 25},
                    ]
                },
                {
                    'name': 'وجبة مسائية كيتو',
                    'meal_type': snack_type,
                    'ingredients': [
                        {'food_ar': 'لحم', 'amount': 100},
                        {'food_ar': 'خضار', 'amount': 80},
                    ]
                }
            ]
        elif diet_plan == 'high_protein':
            iraqi_meals_data = [
                {
                    'name': 'فطور بروتين عراقي',
                    'meal_type': breakfast_type,
                    'ingredients': [
                        {'food_ar': 'بيض', 'amount': 120},
                        {'food_ar': 'جبن أبيض', 'amount': 80},
                        {'food_ar': 'لحم', 'amount': 50},
                    ]
                },
                {
                    'name': 'غداء بروتين عراقي',
                    'meal_type': lunch_type,
                    'ingredients': [
                        {'food_ar': 'لحم', 'amount': 200},
                        {'food_ar': 'خضار مشكلة', 'amount': 150},
                        {'food_ar': 'جبن أبيض', 'amount': 40},
                    ]
                },
                {
                    'name': 'عشاء بروتين عراقي',
                    'meal_type': dinner_type,
                    'ingredients': [
                        {'food_ar': 'سمك', 'amount': 150},
                        {'food_ar': 'خضار مطبوخة', 'amount': 100},
                    ]
                },
                {
                    'name': 'وجبة خفيفة بروتين',
                    'meal_type': snack_type,
                    'ingredients': [
                        {'food_ar': 'جبن أبيض', 'amount': 60},
                    ]
                },
                {
                    'name': 'وجبة مسائية بروتين',
                    'meal_type': snack_type,
                    'ingredients': [
                        {'food_ar': 'لحم', 'amount': 80},
                        {'food_ar': 'بيض', 'amount': 50},
                    ]
                }
            ]
        else:  # balanced or other
            iraqi_meals_data = [
                {
                    'name': 'فطور عراقي تقليدي',
                    'meal_type': breakfast_type,
                    'ingredients': [
                        {'food_ar': 'خبز التنور', 'amount': 100},
                        {'food_ar': 'جبن أبيض عراقي', 'amount': 50},
                        {'food_ar': 'زيت زيتون', 'amount': 10},
                        {'food_ar': 'طماطم طازجة', 'amount': 50},
                    ]
                },
                {
                    'name': 'غداء عراقي تقليدي',
                    'meal_type': lunch_type,
                    'ingredients': [
                        {'food_ar': 'لحم', 'amount': 120},
                        {'food_ar': 'خضار مشكلة', 'amount': 150},
                        {'food_ar': 'رز', 'amount': 100},
                    ]
                },
                {
                    'name': 'عشاء عراقي تقليدي',
                    'meal_type': dinner_type,
                    'ingredients': [
                        {'food_ar': 'سمك', 'amount': 100},
                        {'food_ar': 'خضار مطبوخة', 'amount': 120},
                        {'food_ar': 'جبن أبيض', 'amount': 30},
                    ]
                },
                {
                    'name': 'وجبة خفيفة عراقية',
                    'meal_type': snack_type,
                    'ingredients': [
                        {'food_ar': 'تفاح', 'amount': 100},
                    ]
                },
                {
                    'name': 'وجبة مسائية عراقية',
                    'meal_type': snack_type,
                    'ingredients': [
                        {'food_ar': 'جبن أبيض', 'amount': 40},
                        {'food_ar': 'خيار', 'amount': 60},
                    ]
                }
            ]
        
        # إنشاء الوجبات العراقية لجميع الأيام (7 أيام)
        from datetime import timedelta
        
        # حساب عدد الأيام
        start_date = meal_plan.start_date
        end_date = meal_plan.end_date
        
        print(f"🔍 Debug - start_date type: {type(start_date)}, value: {start_date}")
        print(f"🔍 Debug - end_date type: {type(end_date)}, value: {end_date}")
        
        # التأكد من أن التواريخ هي date objects
        if isinstance(start_date, str):
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if isinstance(end_date, str):
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
        print(f"🔍 Debug - After conversion - start_date type: {type(start_date)}, value: {start_date}")
        print(f"🔍 Debug - After conversion - end_date type: {type(end_date)}, value: {end_date}")
        
        try:
            print(f"🔍 Debug - About to calculate days_count")
            print(f"🔍 Debug - end_date: {end_date} (type: {type(end_date)})")
            print(f"🔍 Debug - start_date: {start_date} (type: {type(start_date)})")
            days_count = (end_date - start_date).days + 1
            print(f"🔍 Debug - days_count calculated successfully: {days_count}")
        except Exception as e:
            print(f"🔍 Debug - Error calculating days_count: {e}")
            print(f"🔍 Debug - start_date: {start_date} (type: {type(start_date)})")
            print(f"🔍 Debug - end_date: {end_date} (type: {type(end_date)})")
            raise e
        
        print(f"📅 إنشاء وجبات لـ {days_count} أيام (من {start_date} إلى {end_date})")
        
        total_meals_created = 0
        
        for day in range(days_count):
            print(f"🔍 Debug - day: {day}, start_date type: {type(start_date)}, value: {start_date}")
            try:
                current_day = start_date + timedelta(days=day)
                print(f"🔍 Debug - current_day calculated successfully: {current_day}")
            except Exception as e:
                print(f"🔍 Debug - Error calculating current_day: {e}")
                print(f"🔍 Debug - start_date: {start_date} (type: {type(start_date)})")
                raise e
            day_of_week = day + 1  # 1 = الاثنين, 2 = الثلاثاء, إلخ
            
            print(f"\n📅 اليوم {day + 1} ({current_day}) - يوم الأسبوع: {day_of_week}")
            
            # إضافة تنويع حقيقي في الوجبات حسب اليوم
            # إنشاء وجبات مختلفة تماماً لكل يوم
            daily_meal_sets = {
                0: [  # اليوم الأول - وجبات تقليدية
                    {'name': 'فطور عراقي تقليدي', 'meal_type': breakfast_type, 'ingredients': [
                        {'food_ar': 'خبز التنور', 'amount': 100}, {'food_ar': 'جبن أبيض', 'amount': 80}, {'food_ar': 'زيت زيتون', 'amount': 10},
                        {'food_ar': 'طماطم', 'amount': 50}, {'food_ar': 'خيار', 'amount': 30}, {'food_ar': 'شاي عراقي', 'amount': 200}
                    ]},
                    {'name': 'غداء عراقي تقليدي', 'meal_type': lunch_type, 'ingredients': [
                        {'food_ar': 'لحم', 'amount': 150}, {'food_ar': 'رز', 'amount': 120}, {'food_ar': 'خضار مشكلة', 'amount': 100},
                        {'food_ar': 'بصل', 'amount': 30}, {'food_ar': 'ثوم', 'amount': 5}, {'food_ar': 'بهارات', 'amount': 10}
                    ]},
                    {'name': 'عشاء عراقي تقليدي', 'meal_type': dinner_type, 'ingredients': [
                        {'food_ar': 'سمك', 'amount': 120}, {'food_ar': 'خضار مطبوخة', 'amount': 80},
                        {'food_ar': 'ليمون', 'amount': 20}, {'food_ar': 'بقدونس', 'amount': 15}, {'food_ar': 'زيت زيتون', 'amount': 15}
                    ]},
                    {'name': 'وجبة خفيفة عراقية', 'meal_type': snack_type, 'ingredients': [
                        {'food_ar': 'تفاح', 'amount': 100}, {'food_ar': 'جوز', 'amount': 20}, {'food_ar': 'عسل', 'amount': 15}
                    ]},
                    {'name': 'وجبة مسائية عراقية', 'meal_type': snack_type, 'ingredients': [
                        {'food_ar': 'جبن أبيض', 'amount': 40}, {'food_ar': 'خيار', 'amount': 60},
                        {'food_ar': 'طماطم', 'amount': 30}, {'food_ar': 'زيتون', 'amount': 20}
                    ]}
                ],
                1: [  # اليوم الثاني - وجبات مشوية
                    {'name': 'فطور عراقي مشوي', 'meal_type': breakfast_type, 'ingredients': [
                        {'food_ar': 'بيض', 'amount': 120}, {'food_ar': 'طماطم', 'amount': 80}, {'food_ar': 'ليمون', 'amount': 20},
                        {'food_ar': 'بصل', 'amount': 30}, {'food_ar': 'فلفل', 'amount': 25}, {'food_ar': 'زيت زيتون', 'amount': 10}
                    ]},
                    {'name': 'غداء عراقي مشوي', 'meal_type': lunch_type, 'ingredients': [
                        {'food_ar': 'دجاج', 'amount': 180}, {'food_ar': 'بطاطس', 'amount': 100}, {'food_ar': 'بصل', 'amount': 50},
                        {'food_ar': 'جزر', 'amount': 40}, {'food_ar': 'ثوم', 'amount': 5}, {'food_ar': 'بهارات مشوية', 'amount': 8}
                    ]},
                    {'name': 'عشاء عراقي مشوي', 'meal_type': dinner_type, 'ingredients': [
                        {'food_ar': 'كباب', 'amount': 140}, {'food_ar': 'خضار مشكلة', 'amount': 90},
                        {'food_ar': 'ليمون', 'amount': 15}, {'food_ar': 'بقدونس', 'amount': 10}, {'food_ar': 'زيت زيتون', 'amount': 12}
                    ]},
                    {'name': 'وجبة خفيفة مشوية', 'meal_type': snack_type, 'ingredients': [
                        {'food_ar': 'جوز', 'amount': 30}, {'food_ar': 'لوز', 'amount': 20}, {'food_ar': 'عسل', 'amount': 10}
                    ]},
                    {'name': 'وجبة مسائية مشوية', 'meal_type': snack_type, 'ingredients': [
                        {'food_ar': 'لبن', 'amount': 150}, {'food_ar': 'جوز', 'amount': 15}, {'food_ar': 'عسل', 'amount': 12}
                    ]}
                ],
                2: [  # اليوم الثالث - وجبات حارة
                    {'name': 'فطور عراقي حار', 'meal_type': breakfast_type, 'ingredients': [
                        {'food_ar': 'فلفل حار', 'amount': 20}, {'food_ar': 'جبن أبيض', 'amount': 70}, {'food_ar': 'ثوم', 'amount': 5},
                        {'food_ar': 'بصل', 'amount': 25}, {'food_ar': 'طماطم', 'amount': 40}, {'food_ar': 'زيت زيتون', 'amount': 8}
                    ]},
                    {'name': 'غداء عراقي حار', 'meal_type': lunch_type, 'ingredients': [
                        {'food_ar': 'لحم حار', 'amount': 160}, {'food_ar': 'رز', 'amount': 110}, {'food_ar': 'فلفل', 'amount': 30},
                        {'food_ar': 'بصل', 'amount': 35}, {'food_ar': 'ثوم', 'amount': 8}, {'food_ar': 'بهارات حارة', 'amount': 12}
                    ]},
                    {'name': 'عشاء عراقي حار', 'meal_type': dinner_type, 'ingredients': [
                        {'food_ar': 'سمك حار', 'amount': 130}, {'food_ar': 'خضار حارة', 'amount': 85},
                        {'food_ar': 'ليمون', 'amount': 18}, {'food_ar': 'بقدونس', 'amount': 12}, {'food_ar': 'زيت زيتون', 'amount': 10}
                    ]},
                    {'name': 'وجبة خفيفة حارة', 'meal_type': snack_type, 'ingredients': [
                        {'food_ar': 'فلفل', 'amount': 25}, {'food_ar': 'جوز', 'amount': 15}, {'food_ar': 'عسل', 'amount': 8}
                    ]},
                    {'name': 'وجبة مسائية حارة', 'meal_type': snack_type, 'ingredients': [
                        {'food_ar': 'جبن حار', 'amount': 50}, {'food_ar': 'ثوم', 'amount': 3},
                        {'food_ar': 'زيتون', 'amount': 20}, {'food_ar': 'فلفل', 'amount': 10}
                    ]}
                ]
            }
            
            # اختيار مجموعة الوجبات حسب اليوم
            if day in daily_meal_sets:
                daily_meals = daily_meal_sets[day]
            else:
                # للأيام الإضافية، استخدام وجبات متنوعة
                daily_meals = iraqi_meals_data
            
            for meal_data in daily_meals:
                # استخدام اسم الوجبة كما هو (مختلف لكل يوم)
                meal_name = meal_data['name']
                
                print(f"  🍽️ إنشاء: {meal_name}")
                
                # استخدام المكونات كما هي (مختلفة لكل يوم)
                varied_ingredients = meal_data['ingredients']
                
                meal = Meal.objects.create(
                    meal_plan=meal_plan,
                    meal_type=meal_data['meal_type'],
                    day_of_week=day_of_week,
                    name=meal_name,
                    description=f'{meal_name} - نظام {diet_plan} عراقي',
                    instructions='اتبع التعليمات التقليدية للطبخ العراقي',
                    prep_time=30
                )
                
                # إضافة المكونات المتنوعة
                ingredients_added = 0
                for ingredient_data in varied_ingredients:
                    food_item = get_food_by_name(ingredient_data['food_ar'])
                    if food_item:
                        MealIngredient.objects.create(
                            meal=meal,
                            food=food_item,
                            amount=float(ingredient_data['amount'])
                        )
                        print(f"    ✅ {food_item.name_ar or food_item.name}: {ingredient_data['amount']}g")
                        ingredients_added += 1
                    else:
                        print(f"    ❌ لم يتم العثور على: {ingredient_data['food_ar']}")
                
                print(f"    📊 تم إضافة {ingredients_added} مكون")
                total_meals_created += 1
        
        print(f"🎉 تم إنشاء {total_meals_created} وجبة عراقية لـ {days_count} أيام تلقائياً!")
        
        serializer = MealPlanSerializer(meal_plan)
        return Response({
            'message': 'تم إنشاء خطة الوجبات بنجاح',
            'meal_plan': serializer.data
        })
        
    except MealPlanTemplate.DoesNotExist:
        return Response({'error': 'القالب غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'error': 'المريض غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _get_overall_status(comparison):
    """تحديد الحالة العامة للخطة الغذائية"""
    if not comparison:
        return {'status': 'غير محدد', 'color': 'gray'}
    
    statuses = [item['status'] for item in comparison.values()]
    
    if all(status == 'ممتاز' for status in statuses):
        return {'status': 'ممتاز', 'color': 'green'}
    elif all(status in ['ممتاز', 'جيد'] for status in statuses):
        return {'status': 'جيد', 'color': 'yellow'}
    else:
        return {'status': 'يحتاج تحسين', 'color': 'red'}