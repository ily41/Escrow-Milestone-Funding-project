from django.db import models
from django.contrib.auth.models import User

class WalletProfile(models.Model):
    ROLE_CHOICES = (
        ("creator", "Creator"),
        ("backer", "Backer"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wallet_profile")
    wallet_address = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="backer")

    def __str__(self):
        return f"{self.user.username} ({self.role})"
