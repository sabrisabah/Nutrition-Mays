from django.urls import path
from . import views

urlpatterns = [
    path('financial-dashboard/', views.financial_dashboard, name='financial-dashboard'),
    path('appointments-dashboard/', views.appointments_dashboard, name='appointments-dashboard'),
    path('patients-dashboard/', views.patients_dashboard, name='patients-dashboard'),
    path('system-overview/', views.system_overview, name='system-overview'),
]
