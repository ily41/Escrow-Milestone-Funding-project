"""
Governance models for voting and audit logs.
"""
from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from users.models import User
from projects.models import Milestone


class Vote(models.Model):
    """Vote model for milestone voting."""
    DECISION_CHOICES = [
        ('approve', 'Approve'),
        ('reject', 'Reject'),
    ]

    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name='votes')
    backer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='votes')
    decision = models.CharField(max_length=10, choices=DECISION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['milestone', 'backer']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.backer.username} - {self.decision} for {self.milestone.title}"


class AuditLog(models.Model):
    """Audit log for tracking system actions."""
    ACTOR_TYPE_CHOICES = [
        ('admin', 'Admin'),
        ('creator', 'Creator'),
        ('backer', 'Backer'),
        ('system', 'System'),
    ]

    actor_type = models.CharField(max_length=20, choices=ACTOR_TYPE_CHOICES)
    actor_id = models.PositiveIntegerField()
    action = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=50)
    entity_id = models.PositiveIntegerField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.actor_type} {self.actor_id} - {self.action}"


