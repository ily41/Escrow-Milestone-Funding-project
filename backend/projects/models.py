"""
Project and milestone models for the crowdfunding platform.
"""
from django.db import models
from django.core.validators import MinValueValidator
from users.models import User, Creator


class Project(models.Model):
    """Project model for crowdfunding campaigns."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('funded', 'Funded'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=255)
    description = models.TextField()
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    escrow_address = models.CharField(max_length=42, blank=True, null=True)
    onchain_project_id = models.PositiveIntegerField(unique=True, null=True, blank=True)
    created_tx_hash = models.CharField(max_length=66, blank=True, null=True)
    DEPLOYMENT_WALLET_TYPE_CHOICES = [
        ('metamask', 'MetaMask'),
        ('local', 'Local Wallet'),
    ]
    deployment_wallet_type = models.CharField(max_length=20, choices=DEPLOYMENT_WALLET_TYPE_CHOICES, blank=True, null=True)
    chain_id = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def total_pledged(self):
        """Calculate total pledged amount from active pledges."""
        from finance.models import Pledge
        return Pledge.objects.filter(
            project=self,
            status='active'
        ).aggregate(total=models.Sum('amount'))['total'] or 0

    @property
    def progress_percentage(self):
        """Calculate funding progress percentage."""
        if self.goal_amount == 0:
            return 0
        return min(100, (float(self.total_pledged) / float(self.goal_amount)) * 100)


class Milestone(models.Model):
    """Milestone model for project stages."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('voting', 'Voting'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=255)
    description = models.TextField()
    target_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    order_index = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateTimeField(null=True, blank=True)
    is_activated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order_index']
        unique_together = ['project', 'order_index']

    def __str__(self):
        return f"{self.project.title} - {self.title}"

    @property
    def approve_votes_count(self):
        """Count approve votes for this milestone."""
        return self.votes.filter(decision='approve').count()

    @property
    def reject_votes_count(self):
        """Count reject votes for this milestone."""
        return self.votes.filter(decision='reject').count()


class Update(models.Model):
    """Project update model for creator announcements."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='updates')
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project.title} - {self.title}"


