from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ('financial', _('Financial Report')),
        ('appointments', _('Appointments Report')),
        ('patients', _('Patients Report')),
        ('doctors', _('Doctors Report')),
        ('meal_plans', _('Meal Plans Report')),
        ('payments', _('Payments Report')),
        ('coupons', _('Coupons Report')),
    ]
    
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('csv', 'CSV'),
        ('xlsx', 'Excel'),
    ]
    
    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES)
    
    # Date range
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Filters
    filters = models.JSONField(blank=True, null=True)
    
    # Generated file
    file = models.FileField(upload_to='reports/', blank=True, null=True)
    
    # Metadata
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generated_reports')
    status = models.CharField(max_length=20, choices=[
        ('pending', _('Pending')),
        ('generating', _('Generating')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
    ], default='pending')
    
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.get_report_type_display()}"
