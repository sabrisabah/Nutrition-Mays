from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from bookings.models import Appointment

User = get_user_model()

class Command(BaseCommand):
    help = 'Setup sample appointments linking patients to doctors'

    def handle(self, *args, **options):
        try:
            # Get a doctor (first user with doctor role)
            doctor = User.objects.filter(role='doctor').first()
            if not doctor:
                self.stdout.write(
                    self.style.ERROR('No doctor found. Please create a doctor first.')
                )
                return
            
            # Get patients
            patients = User.objects.filter(role='patient')
            if not patients.exists():
                self.stdout.write(
                    self.style.ERROR('No patients found. Please run setup_sample_patients first.')
                )
                return
            
            # Create sample appointments
            appointment_data = [
                {
                    'patient': patients[0],  # First patient
                    'scheduled_date': timezone.now().date() - timedelta(days=7),
                    'scheduled_time': '10:00:00',
                    'status': 'completed',
                    'notes_from_doctor': 'موعد مكتمل لإنقاص الوزن'
                },
                {
                    'patient': patients[1] if len(patients) > 1 else patients[0],  # Second patient or first if only one
                    'scheduled_date': timezone.now().date() - timedelta(days=5),
                    'scheduled_time': '14:30:00',
                    'status': 'completed',
                    'notes_from_doctor': 'موعد مكتمل للمحافظة على الوزن'
                },
                {
                    'patient': patients[2] if len(patients) > 2 else patients[0],  # Third patient or first if only one
                    'scheduled_date': timezone.now().date() - timedelta(days=3),
                    'scheduled_time': '16:00:00',
                    'status': 'completed',
                    'notes_from_doctor': 'موعد مكتمل لبناء العضلات'
                }
            ]
            
            for appt_data in appointment_data:
                appointment, created = Appointment.objects.get_or_create(
                    doctor=doctor,
                    patient=appt_data['patient'],
                    scheduled_date=appt_data['scheduled_date'],
                    scheduled_time=appt_data['scheduled_time'],
                    defaults={
                        'status': appt_data['status'],
                        'notes_from_doctor': appt_data['notes_from_doctor'],
                        'consultation_fee': 50000,
                        'appointment_type': 'consultation'
                    }
                )
                
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Created appointment: {appt_data["patient"].get_full_name()} - {appt_data["scheduled_date"]}'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Appointment already exists: {appt_data["patient"].get_full_name()} - {appt_data["scheduled_date"]}'
                        )
                    )
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully setup sample appointments for {patients.count()} patients')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error setting up appointments: {e}')
            )
