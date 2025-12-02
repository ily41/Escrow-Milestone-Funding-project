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

import uuid

class Milestone(models.Model):
    milestone_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='project_id')
    title = models.CharField(max_length=255)
    description = models.TextField()
    # Mapping required_amount to funding_amount in DB
    required_amount = models.DecimalField(max_digits=38, decimal_places=18, default=0, db_column='funding_amount')
    # funded_amount removed as it doesn't exist in DB
    due_date = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True) # Added from schema
    status = models.IntegerField(default=0) # DB uses integer
    # is_activated removed as it's not in DB and not used
    
    # On-chain data
    on_chain_id = models.IntegerField(null=True, blank=True) # Restored
    voting_session_id = models.CharField(max_length=255, null=True, blank=True)
    transaction_hash = models.CharField(max_length=255, null=True, blank=True) # Restored

    class Meta:
        managed = True
        db_table = 'milestones'

class Backer(models.Model):
    backer_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet_address = models.TextField(unique=True)
    name = models.TextField(null=True, blank=True)
    email = models.TextField(null=True, blank=True)
    total_pledged = models.DecimalField(max_digits=38, decimal_places=18, default=0)
    registered_at = models.DateTimeField(auto_now_add=True)
    status = models.IntegerField(default=1)
    user_id = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'backers'

class Pledge(models.Model):
    pledge_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.DO_NOTHING, db_column='project_id')
    backer = models.ForeignKey(Backer, on_delete=models.DO_NOTHING, db_column='backer_id')
    amount = models.DecimalField(max_digits=38, decimal_places=18)
    transaction_hash = models.CharField(max_length=255, unique=True, null=True)
    block_number = models.IntegerField(null=True, blank=True)
    status = models.IntegerField(default=1) # DB uses integer
    voting_power = models.DecimalField(max_digits=38, decimal_places=18, default=0)
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
    vote_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    milestone = models.ForeignKey(Milestone, on_delete=models.DO_NOTHING, related_name='votes', db_column='milestone_id')
    backer = models.ForeignKey(Backer, on_delete=models.DO_NOTHING, db_column='backer_id')
    approval = models.IntegerField()  # 1 = approve, 0 = reject
    vote_weight = models.DecimalField(max_digits=38, decimal_places=18, default=1)
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'votes'

class SyncState(models.Model):
    contract_address = models.CharField(max_length=255, unique=True)
    last_processed_block = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'sync_state'
