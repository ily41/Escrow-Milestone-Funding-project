from django.db import models

class Project(models.Model):
    project_id = models.CharField(max_length=128, primary_key=True)
    title = models.CharField(max_length=255)
    escrow_address = models.CharField(max_length=255)
    creator_address = models.CharField(max_length=255, null=True, blank=True)
    funding_goal = models.DecimalField(max_digits=38, decimal_places=18)
    total_pledged = models.DecimalField(max_digits=38, decimal_places=18, default=0)
    deadline = models.DateTimeField()
    status = models.CharField(max_length=64)
    
    # Sync Metadata
    on_chain_id = models.IntegerField(null=True, unique=True)
    created_tx_hash = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'projects'

class Milestone(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    required_amount = models.DecimalField(max_digits=38, decimal_places=18, default=0)
    funded_amount = models.DecimalField(max_digits=38, decimal_places=18, default=0)
    due_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=64, default='pending')
    is_activated = models.BooleanField(default=False)
    
    # On-chain data
    on_chain_id = models.IntegerField(null=True, blank=True)
    voting_session_id = models.CharField(max_length=255, null=True, blank=True)
    transaction_hash = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'milestones'

class Pledge(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.DO_NOTHING)
    backer_address = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=38, decimal_places=18)
    transaction_hash = models.CharField(max_length=255, unique=True)
    block_number = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=64, default='confirmed')
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

class Vote(models.Model):
    id = models.AutoField(primary_key=True)
    milestone = models.ForeignKey(Milestone, on_delete=models.DO_NOTHING, related_name='votes')
    backer_address = models.CharField(max_length=255)
    decision = models.CharField(max_length=10)  # 'approve' or 'reject'
    weight = models.DecimalField(max_digits=38, decimal_places=18, default=1)
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'votes'
        unique_together = ('milestone', 'backer_address')

class SyncState(models.Model):
    contract_address = models.CharField(max_length=255, unique=True)
    last_processed_block = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'sync_state'
