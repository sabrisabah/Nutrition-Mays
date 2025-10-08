from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Max
from django.utils import timezone
from .models import (
    FoodCategory, Food, MealPlanTemplate, MealPlan, MealType,
    Meal, MealIngredient, MealPlanProgress, Recipe, RecipeIngredient
)
from .serializers import (
    FoodCategorySerializer, FoodSerializer, MealPlanTemplateSerializer,
    MealPlanSerializer, MealTypeSerializer, MealSerializer,
    MealIngredientSerializer, MealPlanProgressSerializer,
    RecipeSerializer, RecipeIngredientSerializer, MealPlanCreateSerializer
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
                    'notes': 'مطبوخ'
                })
            
            if 'vegetables' in foods and foods['vegetables']:
                vegetable = random.choice(foods['vegetables'])
                suggested_meal['ingredients'].append({
                    'food_id': vegetable.id,
                    'food_name': vegetable.name,
                    'food_name_ar': vegetable.name_ar,
                    'amount': 150,
                    'unit': 'g',
                    'notes': 'طازج'
                })
            
            if 'fats' in foods and foods['fats']:
                fat = random.choice(foods['fats'])
                suggested_meal['ingredients'].append({
                    'food_id': fat.id,
                    'food_name': fat.name,
                    'food_name_ar': fat.name_ar,
                    'amount': 10,
                    'unit': 'g',
                    'notes': 'للطبخ'
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
                    'notes': 'مطبوخ'
                })
            
            if 'vegetables' in foods and foods['vegetables']:
                vegetable = random.choice(foods['vegetables'])
                suggested_meal['ingredients'].append({
                    'food_id': vegetable.id,
                    'food_name': vegetable.name,
                    'food_name_ar': vegetable.name_ar,
                    'amount': 200,
                    'unit': 'g',
                    'notes': 'طازج'
                })
            
            if 'fats' in foods and foods['fats']:
                fat = random.choice(foods['fats'])
                suggested_meal['ingredients'].append({
                    'food_id': fat.id,
                    'food_name': fat.name,
                    'food_name_ar': fat.name_ar,
                    'amount': 15,
                    'unit': 'g',
                    'notes': 'للطبخ'
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
            
            # Import the model
            from .models import PatientMealSelection
            
            # Query actual selections from database
            selections = PatientMealSelection.objects.filter(patient_id=patient_id)
            
            # Apply date filter if provided
            if date_filter:
                from datetime import datetime
                try:
                    filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
                    selections = selections.filter(selected_at__date=filter_date)
                except ValueError:
                    pass  # Invalid date format, ignore filter
            
            # Convert to response format
            selections_data = []
            for selection in selections:
                selections_data.append({
                    'id': selection.id,
                    'meal_name': selection.meal_name,
                    'meal_type': selection.meal_type,
                    'selected_at': selection.selected_at.isoformat(),
                    'nutrition_info': {
                        'calories': selection.calories,
                        'protein': selection.protein,
                        'carbs': selection.carbs,
                        'fat': selection.fat
                    },
                    'ingredients': selection.ingredients or [],
                    'notes': selection.notes,
                    'is_confirmed': selection.is_confirmed
                })
            
            return Response(selections_data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, patient_id):
        """Save patient's selected meals"""
        try:
            # Check permissions
            if request.user.role == 'patient' and str(request.user.id) != str(patient_id):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            elif request.user.role not in ['patient', 'doctor', 'admin']:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
            meal_plan_id = request.data.get('meal_plan_id')
            selected_meals = request.data.get('selected_meals', [])
            
            if not meal_plan_id:
                return Response({'error': 'meal_plan_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not selected_meals:
                return Response({'error': 'No meals selected'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Import models
            from .models import PatientMealSelection, MealPlan
            from accounts.models import User
            
            # Get patient and meal plan
            try:
                patient = User.objects.get(id=patient_id)
                meal_plan = MealPlan.objects.get(id=meal_plan_id, patient=patient)
            except (User.DoesNotExist, MealPlan.DoesNotExist):
                return Response({'error': 'Invalid patient or meal plan'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Clear existing selections for this meal plan
            PatientMealSelection.objects.filter(patient=patient, meal_plan=meal_plan).delete()
            
            # Save new selections
            created_selections = []
            for meal in selected_meals:
                # Extract ingredients from meal data
                ingredients = meal.get('ingredients', [])
                if not ingredients and meal.get('meal'):
                    # Try to get ingredients from the meal object
                    ingredients = meal.get('meal', {}).get('ingredients', [])
                
                selection = PatientMealSelection.objects.create(
                    patient=patient,
                    meal_plan=meal_plan,
                    meal_name=meal.get('meal_name', ''),
                    meal_type=meal.get('meal_type', ''),
                    calories=meal.get('nutrition_info', {}).get('calories', 0),
                    protein=meal.get('nutrition_info', {}).get('protein', 0),
                    carbs=meal.get('nutrition_info', {}).get('carbs', 0),
                    fat=meal.get('nutrition_info', {}).get('fat', 0),
                    ingredients=ingredients,
                    notes=meal.get('notes', ''),
                    is_confirmed=True
                )
                created_selections.append({
                    'id': selection.id,
                    'meal_name': selection.meal_name,
                    'meal_type': selection.meal_type,
                    'selected_at': selection.selected_at.isoformat()
                })
            
            return Response({
                'message': f'Successfully saved {len(created_selections)} meal selections',
                'selections': created_selections
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)