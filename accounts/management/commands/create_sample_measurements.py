from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from accounts.models import PatientMeasurement
from datetime import date, timedelta, datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample measurements for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample measurements...')
        
        # Get the test patient
        try:
            patient = User.objects.get(username='patient_test')
            self.stdout.write(f'✅ Found patient: {patient.username} (ID: {patient.id})')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Patient "patient_test" not found. Please run create_sample_meal_plans first.'))
            return
        
        # Create sample measurements for the last 30 days
        today = date.today()
        measurements_data = []
        
        for i in range(30):
            measurement_date = today - timedelta(days=i)
            
            # Create realistic weight progression (losing weight)
            base_weight = 85.0
            weight_loss = i * 0.1  # 0.1kg loss per day
            current_weight = base_weight - weight_loss
            
            # Create measurements for every 3 days
            if i % 3 == 0:
                # Create measurement with specific datetime
                measurement_datetime = timezone.make_aware(datetime.combine(measurement_date, datetime.min.time()))
                measurement = PatientMeasurement.objects.get_or_create(
                    patient=patient,
                    measured_at=measurement_datetime,
                    defaults={
                        'weight': round(current_weight, 1),
                        'waist_circumference': round(95.0 - (i * 0.2), 1),
                        'hip_circumference': round(105.0 - (i * 0.15), 1),
                        'chest_circumference': round(100.0 - (i * 0.1), 1),
                        'arm_circumference': round(32.0 - (i * 0.02), 1),
                        'body_fat_percentage': round(25.0 - (i * 0.1), 1),
                        'muscle_mass': round(65.0 + (i * 0.05), 1),
                        'blood_pressure_systolic': 120,
                        'blood_pressure_diastolic': 80,
                        'blood_sugar': round(95.0 + (i * 0.5), 1),
                        'notes': f'قياس يوم {measurement_date.strftime("%Y-%m-%d")}'
                    }
                )
                
                if measurement[1]:  # If created
                    measurements_data.append(measurement[0])
                    self.stdout.write(f'  ✅ Created measurement for {measurement_date}')
                else:
                    self.stdout.write(f'  ✅ Using existing measurement for {measurement_date}')
        
        self.stdout.write(self.style.SUCCESS('✅ Sample measurements created successfully!'))
        self.stdout.write(f'📊 Summary:')
        self.stdout.write(f'  - Patient: {patient.username} (ID: {patient.id})')
        self.stdout.write(f'  - Total measurements: {PatientMeasurement.objects.filter(patient=patient).count()}')
        self.stdout.write(f'  - Date range: {(today - timedelta(days=29)).strftime("%Y-%m-%d")} to {today.strftime("%Y-%m-%d")}')
        
        # Show latest measurements
        latest_measurements = PatientMeasurement.objects.filter(patient=patient).order_by('-measured_at')[:5]
        self.stdout.write(f'📈 Latest 5 measurements:')
        for measurement in latest_measurements:
            self.stdout.write(f'  - {measurement.measured_at.date()}: Weight: {measurement.weight}kg, Body Fat: {measurement.body_fat_percentage}%')
