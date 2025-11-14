# Dr. Mays Nutrition System - Complete System Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Database Schema](#database-schema)
6. [How the System Works](#how-the-system-works)
7. [Installation & Setup](#installation--setup)
8. [API Documentation](#api-documentation)
9. [Frontend Structure](#frontend-structure)
10. [Key Features & Workflows](#key-features--workflows)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## System Overview

Dr. Mays Nutrition System is a comprehensive nutrition management platform designed for clinics, doctors, and patients. It provides:

- **Patient Management**: Complete patient profiles with health data
- **Meal Planning**: Custom meal plans with automatic calorie adjustment
- **Appointment Scheduling**: Full appointment booking system
- **Payment Processing**: Multiple payment gateway integration
- **Nutrition Calculation**: Automatic BMR, TDEE, and daily calorie calculations
- **Iraqi Food Database**: Comprehensive database of Iraqi foods with nutritional data
- **Progress Tracking**: Weight and health measurements tracking with charts

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Patient    │  │    Doctor    │  │    Admin     │    │
│  │   Interface  │  │   Interface  │  │   Interface  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Django REST)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Accounts   │  │  Meal Plans  │  │  Bookings    │    │
│  │   Module     │  │    Module    │  │   Module     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │  Payments    │  │   Reports    │                       │
│  │   Module     │  │    Module    │                       │
│  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ ORM
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Database (SQLite/PostgreSQL)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Users     │  │  Meal Plans  │  │  Appointments │    │
│  │   Profiles   │  │   Foods      │  │   Payments   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User Action** → Frontend (React Component)
2. **API Call** → Axios HTTP Request
3. **Authentication** → Token-based auth middleware
4. **Backend Processing** → Django View/Serializer
5. **Database Query** → Django ORM
6. **Response** → JSON Response
7. **State Update** → React Query Cache
8. **UI Update** → React Component Re-render

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Programming language |
| Django | 5.2.7 | Web framework |
| Django REST Framework | 3.16.1 | API framework |
| SQLite3 | - | Development database |
| PostgreSQL | - | Production database (optional) |
| Pillow | 11.3.0 | Image processing |
| WhiteNoise | 6.11.0 | Static file serving |
| django-cors-headers | 4.9.0 | CORS handling |
| python-decouple | 3.8 | Environment variables |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI library |
| Vite | 5.0.8 | Build tool |
| React Router | 6.20.1 | Routing |
| React Query | 3.39.3 | Data fetching & caching |
| Axios | 1.6.2 | HTTP client |
| React Hook Form | 7.48.2 | Form management |
| Bootstrap 5 | - | CSS framework |
| Tailwind CSS | 3.3.6 | Utility-first CSS |
| Recharts | 2.8.0 | Charts & graphs |
| React Toastify | 9.1.3 | Notifications |

### Development Tools

- **Git**: Version control
- **Node.js**: 18+ for frontend
- **npm**: Package manager
- **pip**: Python package manager
- **venv**: Python virtual environment

---

## System Components

### 1. Accounts Module (`accounts/`)

**Purpose**: User authentication, authorization, and profile management

**Key Models**:
- `User`: Extended Django User model with roles
- `PatientProfile`: Patient health and nutrition data

**Key Features**:
- User registration and login
- Role-based access control (Patient, Doctor, Admin, Accountant)
- Patient profile management
- BMR and TDEE calculation
- Daily calorie calculation with goal adjustment

**Key Files**:
- `models.py`: User and PatientProfile models
- `views.py`: Authentication and profile views
- `serializers.py`: API serializers
- `urls.py`: URL routing

### 2. Meal Plans Module (`meal_plans/`)

**Purpose**: Meal planning, food database, and nutrition calculation

**Key Models**:
- `FoodCategory`: Food categories
- `Food`: Individual food items with nutritional data
- `MealPlanTemplate`: Reusable meal plan templates
- `MealPlan`: Patient-specific meal plans
- `Meal`: Individual meals within a plan
- `MealIngredient`: Ingredients for each meal
- `PatientMealSelection`: Patient's selected meals

**Key Features**:
- Iraqi food database (200+ foods)
- Automatic calorie adjustment
- Meal plan creation and management
- Nutrition calculation
- Ingredient tracking

**Key Files**:
- `models.py`: All meal-related models
- `views.py`: API endpoints for meals
- `nutrition_calculator.py`: Nutrition calculation logic
- `serializers.py`: API serializers
- `admin.py`: Django admin configuration

### 3. Bookings Module (`bookings/`)

**Purpose**: Appointment scheduling and management

**Key Models**:
- `Appointment`: Patient appointments
- `DoctorAvailability`: Doctor available time slots
- `DoctorUnavailability`: Doctor holidays/unavailable times

**Key Features**:
- Appointment booking
- Doctor availability management
- Appointment confirmation/cancellation
- Appointment reminders

### 4. Payments Module (`payments/`)

**Purpose**: Payment processing and invoice management

**Key Models**:
- `Invoice`: Patient invoices
- `Payment`: Payment transactions
- `PaymentProvider`: Payment gateway configuration
- `Coupon`: Discount coupons

**Key Features**:
- Multiple payment gateways (QiCard, ZainCash, AsiaHawala, Switch)
- Invoice generation
- Payment processing
- Coupon management
- Payment history

### 5. Reports Module (`reports/`)

**Purpose**: Financial and operational reports

**Key Features**:
- Financial reports
- Patient reports
- Doctor reports
- Export to PDF/Excel/CSV

---

## Database Schema

### Core Models

#### User (Extended Django User)
```python
- id: Primary key
- username: String (unique)
- email: String (unique)
- password: Hashed password
- role: String (patient, doctor, admin, accountant)
- phone: String
- avatar: ImageField
- date_of_birth: Date
- is_verified: Boolean
- created_at: DateTime
- updated_at: DateTime
```

#### PatientProfile
```python
- user: OneToOne(User)
- gender: String (male, female)
- height: Float (cm)
- current_weight: Float (kg)
- target_weight: Float (kg)
- activity_level: String (sedentary, light, moderate, active, very_active)
- goal: String (lose_weight, gain_weight, maintain_weight, build_muscle, improve_health)
- medical_conditions: Text
- dietary_restrictions: Text
- medications: Text
- daily_calories: Integer
- created_at: DateTime
- updated_at: DateTime
```

#### MealPlan
```python
- id: Primary key
- patient: ForeignKey(User)
- doctor: ForeignKey(User)
- title: String
- description: Text
- template: ForeignKey(MealPlanTemplate, nullable)
- start_date: Date
- end_date: Date
- target_calories: Integer
- target_protein: Float
- target_carbs: Float
- target_fat: Float
- diet_plan: String
- status: String (waiting, delivered, acknowledged, in_progress, completed, cancelled)
- is_active: Boolean
- created_at: DateTime
- updated_at: DateTime
```

#### Meal
```python
- id: Primary key
- meal_plan: ForeignKey(MealPlan)
- name: String
- meal_type: String (breakfast, lunch, dinner, snack)
- description: Text
- created_at: DateTime
```

#### MealIngredient
```python
- id: Primary key
- meal: ForeignKey(Meal)
- food: ForeignKey(Food)
- amount: Float (grams)
- notes: Text
```

#### Food
```python
- id: Primary key
- name: String
- name_ar: String (Arabic name)
- category: ForeignKey(FoodCategory)
- calories_per_100g: Float
- protein_per_100g: Float
- carbs_per_100g: Float
- fat_per_100g: Float
- fiber_per_100g: Float
- is_active: Boolean
```

#### PatientMealSelection
```python
- id: Primary key
- patient: ForeignKey(User)
- meal_plan: ForeignKey(MealPlan)
- meal_name: String
- meal_type: String
- selected_at: DateTime
- calories: Float
- protein: Float
- carbs: Float
- fat: Float
- ingredients: JSONField (list of ingredients with amounts)
- notes: Text
- is_confirmed: Boolean
- unique_together: (patient, meal_plan, meal_name, meal_type)
```

#### Appointment
```python
- id: Primary key
- patient: ForeignKey(User)
- doctor: ForeignKey(User)
- appointment_type: String (consultation, follow_up, meal_plan_review, progress_check)
- scheduled_date: Date
- scheduled_time: Time
- duration: Integer (minutes)
- status: String (pending, confirmed, cancelled, completed, no_show)
- consultation_fee: Decimal
- is_paid: Boolean
- created_at: DateTime
```

---

## How the System Works

### 1. User Registration & Authentication

**Flow**:
1. User registers with email/username and password
2. System creates User record with role
3. If patient, PatientProfile is created
4. User receives authentication token
5. Token stored in localStorage (frontend)
6. Token sent with every API request

**Code Location**:
- Backend: `accounts/views.py` - `RegisterView`, `LoginView`
- Frontend: `src/pages/auth/RegisterPage.jsx`, `src/pages/auth/LoginPage.jsx`

### 2. Patient Profile Setup

**Flow**:
1. Patient fills health information (height, weight, activity level, goal)
2. System calculates BMR using Mifflin-St Jeor equation:
   - Male: `BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5`
   - Female: `BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161`
3. System calculates TDEE: `TDEE = BMR × Activity Multiplier`
4. System applies goal adjustment:
   - Lose weight: -500 calories
   - Gain weight: +500 calories
   - Build muscle: +300 calories
   - Maintain weight: 0 calories
   - Improve health: 0 calories
5. Final daily calories = TDEE + goal adjustment

**Code Location**:
- Backend: `accounts/models.py` - `PatientProfile.calculate_daily_calories()`
- Frontend: `src/utils/bmrCalculator.js`

### 3. Meal Plan Creation (Doctor)

**Flow**:
1. Doctor selects patient
2. Doctor creates MealPlan with:
   - Title and description
   - Start/end dates
   - Target calories (from patient's calculated daily calories)
   - Diet type (keto, balanced, protein, etc.)
3. Doctor adds meals to plan:
   - Select meal type (breakfast, lunch, dinner, snack)
   - Add ingredients from food database
   - System calculates nutrition automatically
4. Meal plan marked as "delivered" to patient

**Code Location**:
- Backend: `meal_plans/views.py` - `MealPlanListCreateView`
- Frontend: `src/pages/doctor/MealPlans.jsx`

### 4. Patient Meal Selection

**Flow**:
1. Patient views available meal plans
2. Patient selects 5 meals per day:
   - 1 breakfast
   - 1 lunch
   - 1 dinner
   - 2 snacks
3. Patient clicks "Save Selections"
4. **Backend Processing**:
   - System retrieves patient's required calories (TDEE + goal adjustment)
   - System calculates total calories from selected meals
   - If difference > 50 calories:
     - System adjusts ingredient amounts proportionally
     - Formula: `new_amount = old_amount × (target_calories / current_calories)`
     - Recalculates all nutrition values
   - System saves adjusted meals to `PatientMealSelection`
5. Patient sees final adjusted meals

**Code Location**:
- Backend: `meal_plans/views.py` - `PatientMealSelectionsView.post()`
- Frontend: `src/pages/patient/MealPlans.jsx`

### 5. Automatic Calorie Adjustment Algorithm

**Detailed Process**:

```python
1. Get target calories = patient.calculate_daily_calories()
2. Calculate current total = sum(meal calories from selected meals)
3. Calculate difference = abs(current_total - target_calories)
4. If difference > 50:
   a. Calculate adjustment factor = target_calories / current_total
   b. For each meal:
      - For each ingredient:
        - new_amount = old_amount × adjustment_factor
        - Recalculate: calories = (amount × calories_per_100g) / 100
        - Recalculate: protein = (amount × protein_per_100g) / 100
        - Recalculate: carbs = (amount × carbs_per_100g) / 100
        - Recalculate: fat = (amount × fat_per_100g) / 100
      - Sum ingredient values for meal totals
   c. Recalculate total = sum(adjusted meal calories)
   d. If still not within 50 calories, repeat with more aggressive adjustment
5. Save adjusted meals to database
```

**Code Location**:
- Backend: `meal_plans/views.py` - Lines 1790-2400 (POST method)

### 6. Appointment Booking

**Flow**:
1. Patient views available doctors
2. Patient selects doctor and date
3. System shows available time slots
4. Patient selects time and appointment type
5. System creates Appointment with status "pending"
6. Doctor confirms appointment
7. System sends notification to patient
8. Patient can cancel (with restrictions)

**Code Location**:
- Backend: `bookings/views.py`
- Frontend: `src/pages/patient/Appointments.jsx`

### 7. Payment Processing

**Flow**:
1. System generates invoice for service
2. Patient views invoice
3. Patient selects payment method
4. System redirects to payment gateway
5. Payment gateway processes payment
6. System receives callback
7. System updates invoice and payment status
8. System sends receipt to patient

**Code Location**:
- Backend: `payments/views.py`
- Frontend: `src/pages/patient/Payments.jsx`

---

## Installation & Setup

### Prerequisites

**Windows**:
- Windows 10/11
- Python 3.11+
- Node.js 18+
- Git

**Ubuntu/Linux**:
- Ubuntu 20.04 LTS+
- Python 3.11+
- Node.js 18+
- Git
- Nginx (for production)

### Step-by-Step Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd 1212
```

#### 2. Backend Setup

**Windows**:
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements_windows.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

**Ubuntu/Linux**:
```bash
# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

#### 3. Frontend Setup

```bash
# Install dependencies
npm install

# Build for production (optional)
npm run build
```

#### 4. Environment Variables

Create `.env` file in project root:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite for development)
DATABASE_URL=sqlite:///db.sqlite3

# For PostgreSQL (production)
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Payment Gateways (optional)
QICARD_API_KEY=your-api-key
ZAINCASH_MERCHANT_ID=your-merchant-id
ASIAHAWALA_API_KEY=your-api-key
```

#### 5. Load Initial Data (Optional)

```bash
# Upload Iraqi foods database
python manage.py upload_all_iraqi_foods

# Create sample meal templates
python manage.py setup_meal_templates
```

#### 6. Run Development Server

**Terminal 1 - Backend**:
```bash
python manage.py runserver
# Backend runs on http://localhost:8000
```

**Terminal 2 - Frontend**:
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

#### 7. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin

---

## API Documentation

### Authentication

All API endpoints (except login/register) require authentication via token.

**Get Token**:
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "patient1",
  "password": "password123"
}

Response:
{
  "token": "abc123...",
  "user": {
    "id": 1,
    "username": "patient1",
    "email": "patient1@example.com",
    "role": "patient"
  }
}
```

**Use Token**:
```http
Authorization: Token abc123...
```

### Patient Endpoints

#### Get Patient Profile
```http
GET /api/patients/profile/
Authorization: Token <token>

Response:
{
  "id": 1,
  "user": {
    "id": 1,
    "username": "patient1",
    "email": "patient1@example.com"
  },
  "gender": "male",
  "height": 175,
  "current_weight": 80,
  "target_weight": 75,
  "activity_level": "moderate",
  "goal": "lose_weight",
  "daily_calories": 2242
}
```

#### Update Patient Profile
```http
PUT /api/patients/profile/
Authorization: Token <token>
Content-Type: application/json

{
  "height": 175,
  "current_weight": 80,
  "target_weight": 75,
  "activity_level": "moderate",
  "goal": "lose_weight"
}
```

#### Get Meal Plans
```http
GET /api/meals/patients/{patient_id}/meal-plans/
Authorization: Token <token>

Response:
[
  {
    "id": 1,
    "title": "Weight Loss Plan",
    "description": "Custom meal plan",
    "target_calories": 2000,
    "start_date": "2025-01-15",
    "end_date": "2025-02-15",
    "status": "delivered",
    "meals": [...]
  }
]
```

#### Save Meal Selections
```http
POST /api/meals/patients/{patient_id}/selected-meals/
Authorization: Token <token>
Content-Type: application/json

{
  "meal_plan_id": 1,
  "selected_meals": [
    {
      "meal_id": 1,
      "meal_name": "Breakfast Meal",
      "meal_type": "breakfast",
      "ingredients": [
        {
          "food_id": 1,
          "food_name": "Eggs",
          "amount": 100,
          "calories_per_100g": 155
        }
      ]
    }
  ]
}

Response:
{
  "message": "Meals saved successfully",
  "total_calories": 2242,
  "required_calories": 2242,
  "selections": [...]
}
```

#### Get Selected Meals
```http
GET /api/meals/patients/{patient_id}/selected-meals/?meal_plan_id=1&date=2025-01-15
Authorization: Token <token>

Response:
{
  "required_calories": 2242,
  "selections": [
    {
      "id": 1,
      "meal_name": "Breakfast Meal",
      "meal_type": "breakfast",
      "calories": 450,
      "protein": 25,
      "carbs": 30,
      "fat": 20,
      "ingredients": [...]
    }
  ]
}
```

### Doctor Endpoints

#### Get Patients List
```http
GET /api/doctors/patients/
Authorization: Token <token>
```

#### Create Meal Plan
```http
POST /api/meals/meal-plans/
Authorization: Token <token>
Content-Type: application/json

{
  "patient_id": 1,
  "title": "Weight Loss Plan",
  "description": "Custom meal plan",
  "target_calories": 2000,
  "target_protein": 150,
  "target_carbs": 200,
  "target_fat": 65,
  "start_date": "2025-01-15",
  "end_date": "2025-02-15",
  "diet_plan": "balanced"
}
```

#### Get Patient Meal Selections
```http
GET /api/meals/patients/{patient_id}/selected-meals/?meal_plan_id=1
Authorization: Token <token>
```

### Food Database Endpoints

#### Get Food Categories
```http
GET /api/meals/food-categories/
Authorization: Token <token>
```

#### Get Foods
```http
GET /api/meals/foods/?category=1&search=rice
Authorization: Token <token>
```

#### Get Food Details
```http
GET /api/meals/foods/{food_id}/
Authorization: Token <token>
```

### Appointment Endpoints

#### Book Appointment
```http
POST /api/bookings/appointments/
Authorization: Token <token>
Content-Type: application/json

{
  "doctor_id": 2,
  "appointment_type": "consultation",
  "scheduled_date": "2025-01-20",
  "scheduled_time": "10:00:00"
}
```

#### Get Appointments
```http
GET /api/bookings/appointments/?status=pending
Authorization: Token <token>
```

### Payment Endpoints

#### Get Invoices
```http
GET /api/payments/invoices/
Authorization: Token <token>
```

#### Pay Invoice
```http
POST /api/payments/invoices/{invoice_id}/pay/
Authorization: Token <token>
Content-Type: application/json

{
  "payment_provider": "qicard",
  "coupon_code": "DISCOUNT10"
}
```

---

## Frontend Structure

### Directory Structure

```
src/
├── components/          # Reusable components
│   ├── common/          # Common components (LoadingSpinner, ProtectedRoute)
│   ├── doctor/          # Doctor-specific components
│   ├── patient/         # Patient-specific components
│   ├── nutrition/       # Nutrition calculator components
│   └── layout/          # Layout components (Navbar, Sidebar)
├── pages/               # Page components
│   ├── admin/           # Admin pages
│   ├── doctor/          # Doctor pages
│   ├── patient/         # Patient pages
│   └── auth/            # Authentication pages
├── contexts/            # React contexts (Auth, Language)
├── hooks/               # Custom React hooks
├── services/            # API services
├── utils/               # Utility functions
└── main.jsx             # Entry point
```

### Key Components

#### Patient Components

**`MealPlans.jsx`**:
- Displays available meal plans
- Allows meal selection
- Shows nutrition information
- Handles meal saving

**`PatientSelectedMeals.jsx`**:
- Displays selected meals
- Shows daily nutrition summary
- Displays ingredients

**`Dashboard.jsx`**:
- Patient dashboard
- Health statistics
- Weight progress chart
- Recent measurements

**`Measurements.jsx`**:
- Record weight and measurements
- View progress charts
- Track health metrics

#### Doctor Components

**`MealPlans.jsx`**:
- Create meal plans
- Add meals to plans
- View patient meal selections

**`PatientProfile.jsx`**:
- View patient health data
- View meal selections
- Nutrition calculations

**`DailyMealPlanner.jsx`**:
- Iraqi meal planner
- Template-based meal plans
- Nutrition summaries

### State Management

**React Query**:
- Data fetching and caching
- Automatic refetching
- Optimistic updates

**React Context**:
- Authentication state
- Language preferences

**Local State**:
- Form data (React Hook Form)
- UI state (useState)

### Routing

**React Router**:
- Protected routes (require authentication)
- Role-based routing
- Nested routes

**Route Structure**:
```
/ → Login (if not authenticated)
/patient/dashboard → Patient Dashboard
/patient/meal-plans → Meal Plans
/patient/appointments → Appointments
/doctor/dashboard → Doctor Dashboard
/doctor/patients → Patients List
/doctor/meal-plans → Meal Plans Management
/admin/dashboard → Admin Dashboard
```

---

## Key Features & Workflows

### 1. Nutrition Calculation System

**BMR Calculation (Mifflin-St Jeor)**:
- Most accurate BMR formula
- Accounts for age, gender, weight, height
- Used as base for TDEE calculation

**TDEE Calculation**:
- BMR × Activity Multiplier
- Activity levels:
  - Sedentary: 1.2
  - Light: 1.375
  - Moderate: 1.55
  - Active: 1.725
  - Very Active: 1.9

**Goal Adjustment**:
- Lose weight: -500 calories
- Gain weight: +500 calories
- Build muscle: +300 calories
- Maintain/Improve health: 0 calories

**Code Location**:
- `accounts/models.py`: `PatientProfile.calculate_daily_calories()`
- `src/utils/bmrCalculator.js`

### 2. Automatic Meal Adjustment

**Process**:
1. Patient selects meals
2. System calculates total calories
3. Compares with required calories
4. If difference > 50 calories:
   - Adjusts all ingredient amounts proportionally
   - Maintains nutritional ratios
   - Recalculates all values
5. Saves adjusted meals

**Code Location**:
- `meal_plans/views.py`: `PatientMealSelectionsView.post()`

### 3. Iraqi Food Database

**Features**:
- 200+ Iraqi foods
- Complete nutritional data
- Categories (grains, proteins, vegetables, etc.)
- Arabic and English names

**Management**:
- Django admin interface
- Management command: `upload_all_iraqi_foods`

**Code Location**:
- `meal_plans/models.py`: `Food`, `FoodCategory`
- `meal_plans/management/commands/upload_all_iraqi_foods.py`

### 4. Meal Plan Templates

**Features**:
- Pre-configured meal plans
- Diet types: Keto, Balanced, Protein, etc.
- Reusable templates
- Customizable per patient

**Code Location**:
- `meal_plans/models.py`: `MealPlanTemplate`
- `src/components/DailyMealPlanner.jsx`

### 5. Progress Tracking

**Features**:
- Weight tracking
- Body measurements
- Progress charts (Recharts)
- Historical data

**Code Location**:
- `src/pages/patient/Measurements.jsx`
- `src/pages/patient/Dashboard.jsx`

### 6. Appointment System

**Features**:
- Doctor availability management
- Time slot booking
- Appointment confirmation
- Cancellation handling
- Reminders

**Code Location**:
- `bookings/models.py`
- `bookings/views.py`
- `src/pages/patient/Appointments.jsx`

### 7. Payment Integration

**Supported Gateways**:
- QiCard
- ZainCash
- AsiaHawala
- Switch

**Features**:
- Invoice generation
- Payment processing
- Coupon support
- Receipt generation

**Code Location**:
- `payments/models.py`
- `payments/views.py`

---

## Deployment

### Production Setup (Ubuntu)

#### 1. Server Requirements
- Ubuntu 20.04+ LTS
- 2GB+ RAM
- 20GB+ storage
- Domain name (for SSL)

#### 2. Install System Dependencies
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install python3.11 python3.11-venv python3.11-dev python3-pip nodejs npm git nginx postgresql redis-server -y
```

#### 3. Setup PostgreSQL
```bash
sudo -u postgres psql
CREATE DATABASE drmays_db;
CREATE USER drmays_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE drmays_db TO drmays_user;
\q
```

#### 4. Deploy Application
```bash
# Clone repository
git clone <repository-url>
cd 1212

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
npm install

# Build frontend
npm run build

# Setup environment
cp .env.example .env
# Edit .env with production settings

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser
```

#### 5. Setup Gunicorn
```bash
pip install gunicorn

# Create systemd service
sudo nano /etc/systemd/system/drmays.service
```

**Service File**:
```ini
[Unit]
Description=Dr Mays Nutrition Django App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/drmays/1212
Environment="PATH=/var/www/drmays/1212/venv/bin"
ExecStart=/var/www/drmays/1212/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 dr_mays_nutrition.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start drmays
sudo systemctl enable drmays
```

#### 6. Setup Nginx
```bash
sudo nano /etc/nginx/sites-available/drmays
```

**Nginx Config**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /var/www/drmays/1212/static/;
    }

    location /media/ {
        alias /var/www/drmays/1212/media/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/drmays /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. Setup SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

#### 8. Setup Frontend Production Server

For production, you can either:
- Serve static files through Nginx
- Use PM2 to run Vite in production mode
- Build and serve static files

**Option 1: Static Files (Recommended)**
```bash
npm run build
# Serve dist/ folder through Nginx
```

**Option 2: PM2**
```bash
npm install -g pm2
pm2 start npm --name "drmays-frontend" -- run dev
pm2 save
pm2 startup
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check database settings in .env
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l
```

#### 2. Migration Errors
```bash
# Reset migrations (development only)
python manage.py migrate --fake-initial
python manage.py migrate
```

#### 3. Static Files Not Loading
```bash
# Collect static files
python manage.py collectstatic --noinput

# Check permissions
chmod -R 755 static/
```

#### 4. Frontend Build Errors
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 5. CORS Errors
```bash
# Check CORS settings in settings.py
# Verify ALLOWED_HOSTS includes your domain
```

#### 6. Token Authentication Issues
```bash
# Check token in localStorage
# Verify token is sent in Authorization header
# Check token expiration
```

### Debug Mode

**Enable Debug Logging**:
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'logs/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
        },
    },
}
```

### Log Files

**Django Logs**:
```bash
tail -f logs/django.log
```

**Nginx Logs**:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Systemd Logs**:
```bash
sudo journalctl -u drmays -f
```

---

## Additional Resources

### Documentation Files
- `README.md`: Basic overview
- `COMPLETE_INSTALLATION_GUIDE.md`: Detailed installation
- `PATIENT_PAYMENT_SYSTEM_GUIDE.md`: Payment system guide
- `MIFLIN_ST_JEOR_IMPLEMENTATION.md`: BMR calculation details

### Management Commands
- `upload_all_iraqi_foods`: Upload Iraqi food database
- `setup_meal_templates`: Create meal templates
- `create_sample_meal_plans`: Create sample data

### Support
- Email: support@drmays.com
- Documentation: This file
- GitHub Issues: For bug reports

---

**Last Updated**: 2025-01-15  
**Version**: 1.0.0  
**Author**: Dr. Mays Development Team

