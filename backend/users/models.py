"""
User models for the crowdfunding platform.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended user model with additional fields."""
    email = models.EmailField(unique=True)
    is_creator = models.BooleanField(default=False)
    is_backer = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username


class Creator(models.Model):
    """Creator profile for project creators."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='creator_profile')
    display_name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.display_name


