from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'users', views.UserViewSet)

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Regular URL patterns
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('user/', views.UserUpdateView.as_view(), name='user-update'),
    path('patient-profile/', views.PatientProfileView.as_view(), name='patient-profile'),
    path('doctor-patient-profile/', views.DoctorPatientProfileView.as_view(), name='doctor-patient-profile'),
    path('doctor-profile/', views.DoctorProfileView.as_view(), name='doctor-profile'),
    path('measurements/', views.PatientMeasurementListCreateView.as_view(), name='measurements'),
    path('measurements/<int:pk>/', views.PatientMeasurementDetailView.as_view(), name='measurement-detail'),
    path('medical-documents/', views.MedicalDocumentListCreateView.as_view(), name='medical-documents'),
    path('doctors/', views.DoctorListView.as_view(), name='doctors'),
    path('patients/', views.DoctorPatientsView.as_view(), name='patients'),
]
