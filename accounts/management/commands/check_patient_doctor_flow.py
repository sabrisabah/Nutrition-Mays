from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from bookings.models import Appointment

User = get_user_model()

class Command(BaseCommand):
    help = 'Check the patient-doctor flow and provide guidance'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== فحص تدفق المرضى والأطباء ===\n'))
        
        # Check doctors
        doctors = User.objects.filter(role='doctor')
        self.stdout.write(f'عدد الأطباء: {doctors.count()}')
        for doctor in doctors:
            self.stdout.write(f'  - {doctor.first_name} {doctor.last_name} (ID: {doctor.id})')
        
        # Check patients
        patients = User.objects.filter(role='patient')
        self.stdout.write(f'\nعدد المرضى: {patients.count()}')
        for patient in patients:
            self.stdout.write(f'  - {patient.first_name} {patient.last_name} (ID: {patient.id})')
        
        # Check appointments
        appointments = Appointment.objects.all()
        self.stdout.write(f'\nعدد المواعيد: {appointments.count()}')
        
        if appointments.count() > 0:
            self.stdout.write('\nتفاصيل المواعيد:')
            for appointment in appointments:
                self.stdout.write(f'  - المريض: {appointment.patient.first_name} {appointment.patient.last_name}')
                self.stdout.write(f'    الطبيب: {appointment.doctor.first_name} {appointment.doctor.last_name}')
                self.stdout.write(f'    التاريخ: {appointment.scheduled_date} {appointment.scheduled_time}')
                self.stdout.write(f'    الحالة: {appointment.status}')
                self.stdout.write('')
        
        # Check patient-doctor relationships
        self.stdout.write('=== فحص العلاقات بين المرضى والأطباء ===')
        
        for doctor in doctors:
            doctor_appointments = Appointment.objects.filter(doctor=doctor)
            doctor_patients = doctor_appointments.values_list('patient', flat=True).distinct()
            
            self.stdout.write(f'\nالطبيب: {doctor.first_name} {doctor.last_name}')
            self.stdout.write(f'  عدد المواعيد: {doctor_appointments.count()}')
            self.stdout.write(f'  عدد المرضى: {len(doctor_patients)}')
            
            if doctor_patients:
                self.stdout.write('  المرضى:')
                for patient_id in doctor_patients:
                    patient = User.objects.get(id=patient_id)
                    self.stdout.write(f'    - {patient.first_name} {patient.last_name}')
            else:
                self.stdout.write('  لا يوجد مرضى مرتبطين بهذا الطبيب')
        
        # Provide guidance
        self.stdout.write('\n=== التوجيهات ===')
        
        if doctors.count() == 0:
            self.stdout.write(self.style.ERROR('تحذير: لا يوجد أطباء في النظام'))
            self.stdout.write('قم بإنشاء طبيب أولاً من خلال Django Admin أو التسجيل')
        
        if patients.count() == 0:
            self.stdout.write(self.style.ERROR('تحذير: لا يوجد مرضى في النظام'))
            self.stdout.write('قم بإنشاء مرضى أولاً من خلال Django Admin أو التسجيل')
        
        if appointments.count() == 0:
            self.stdout.write(self.style.WARNING('تحذير: لا يوجد مواعيد في النظام'))
            self.stdout.write('المرضى لن يظهرون في قائمة الطبيب حتى يحجزوا مواعيد')
            self.stdout.write('لإنشاء مواعيد تجريبية، قم بتشغيل: python manage.py setup_sample_appointments')
        
        if doctors.count() > 0 and patients.count() > 0 and appointments.count() > 0:
            self.stdout.write(self.style.SUCCESS('النظام يعمل بشكل صحيح!'))
            self.stdout.write('المرضى الذين لديهم مواعيد مع الأطباء سيظهرون في قائمة المرضى')
        
        self.stdout.write('\n=== ملاحظات مهمة ===')
        self.stdout.write('1. المرضى يظهرون في قائمة الطبيب فقط بعد حجز موعد معه')
        self.stdout.write('2. إذا كان المريض مسجل ولكن لا يظهر، تأكد من وجود موعد مع الطبيب الصحيح')
        self.stdout.write('3. يمكن للمرضى حجز المواعيد من خلال واجهة المريض في النظام')
        self.stdout.write('4. تأكد من أن الطبيب المسجل دخول هو نفسه الموجود في المواعيد')
