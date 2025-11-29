from django.db import models

class Project(models.Model):
    project_id = models.CharField(max_length=128, primary_key=True)
    title = models.CharField(max_length=255)
    escrow_address = models.CharField(max_length=255)
    funding_goal = models.DecimalField(max_digits=38, decimal_places=18)
    deadline = models.DateTimeField()
    status = models.CharField(max_length=64)

    class Meta:
        managed = True
        db_table = 'projects'

class Milestone(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.DO_NOTHING)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    percentage = models.IntegerField()
    status = models.CharField(max_length=64)

    class Meta:
        managed = True
        db_table = 'milestones'

class Pledge(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.DO_NOTHING)
    backer_address = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=38, decimal_places=18)
    transaction_hash = models.CharField(max_length=255)
    pledged_at = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'pledges'

class Release(models.Model):
    id = models.AutoField(primary_key=True)
    milestone = models.ForeignKey(Milestone, on_delete=models.DO_NOTHING)
    amount = models.DecimalField(max_digits=38, decimal_places=18)
    transaction_hash = models.CharField(max_length=255)
    released_at = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'releases'

class Refund(models.Model):
    id = models.AutoField(primary_key=True)
    pledge = models.ForeignKey(Pledge, on_delete=models.DO_NOTHING)
    amount = models.DecimalField(max_digits=38, decimal_places=18)
    transaction_hash = models.CharField(max_length=255)
    refunded_at = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'refunds'

class AuditLog(models.Model):
    id = models.AutoField(primary_key=True)
    transaction_hash = models.CharField(max_length=255)
    event_name = models.CharField(max_length=255)
    payload = models.JSONField()
    created_at = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'audit_logs'
