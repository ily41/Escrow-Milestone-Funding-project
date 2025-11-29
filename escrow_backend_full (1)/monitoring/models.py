from django.db import models
from django.contrib.auth.models import User

class RequestLog(models.Model):
    path = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    status_code = models.IntegerField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    duration_ms = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class AdminResolution(models.Model):
    project_id = models.CharField(max_length=128, null=True, blank=True)
    milestone_id = models.CharField(max_length=128, null=True, blank=True)
    action = models.CharField(max_length=64)
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
