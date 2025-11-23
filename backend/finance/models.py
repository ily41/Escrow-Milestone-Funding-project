"""
Finance models for wallets, pledges, releases, and refunds.
"""
from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from users.models import User
from projects.models import Project, Milestone


class Wallet(models.Model):
    """Wallet model for storing balances."""
    OWNER_TYPE_CHOICES = [
        ('creator', 'Creator'),
        ('backer', 'Backer'),
        ('platform', 'Platform'),
    ]

    owner_type = models.CharField(max_length=20, choices=OWNER_TYPE_CHOICES)
    owner_id = models.PositiveIntegerField()
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='USD')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['owner_type', 'owner_id', 'currency']

    def __str__(self):
        return f"{self.owner_type} {self.owner_id} - {self.currency} {self.balance}"

    @classmethod
    def get_or_create_wallet(cls, owner_type, owner_id, currency='USD'):
        """Get or create a wallet for an owner."""
        wallet, created = cls.objects.get_or_create(
            owner_type=owner_type,
            owner_id=owner_id,
            currency=currency,
            defaults={'balance': 0}
        )
        return wallet


class Pledge(models.Model):
    """Pledge model for backer contributions."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='pledges')
    backer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pledges')
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    payment_reference = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.backer.username} - {self.amount} {self.currency} to {self.project.title}"


class Release(models.Model):
    """Release model for milestone fund releases."""
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name='releases')
    amount_released = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    released_to_wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='releases')
    released_at = models.DateTimeField(auto_now_add=True)
    tx_reference = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-released_at']

    def __str__(self):
        return f"Release {self.amount_released} for {self.milestone.title}"


class Refund(models.Model):
    """Refund model for backer refunds."""
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('processed', 'Processed'),
        ('rejected', 'Rejected'),
    ]

    pledge = models.ForeignKey(Pledge, on_delete=models.CASCADE, related_name='refunds')
    milestone = models.ForeignKey(Milestone, on_delete=models.SET_NULL, null=True, blank=True, related_name='refunds')
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Refund {self.amount} for {self.pledge}"


