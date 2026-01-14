from rest_framework import serializers
from indexer.models import Project, Milestone, Pledge, Release, Refund, AuditLog, Vote

class MilestoneSerializer(serializers.ModelSerializer):
    approve_votes_count = serializers.SerializerMethodField()
    reject_votes_count = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    is_activated = serializers.SerializerMethodField()

    class Meta:
        model = Milestone
        fields = "__all__"
        read_only_fields = ('transaction_hash', 'voting_session_id', 'status')

    def get_approve_votes_count(self, obj):
        return obj.votes.filter(approval=1).count()

    def get_reject_votes_count(self, obj):
        return obj.votes.filter(approval=0).count()

    def get_progress(self, obj):
        # Progress based on milestone funding
        # funded_amount removed from model, returning 0 for now
        return 0
    
    def get_is_activated(self, obj):
        # Return the actual is_activated field from database
        return obj.is_activated

    def to_representation(self, instance):
        from django.db.models import Sum
        data = super().to_representation(instance)
        project = instance.project
        # confirmed + pending (status 0)
        confirmed = project.total_pledged or 0
        pending = project.pledges.filter(status=0).aggregate(s=Sum('amount'))['s'] or 0
        total_raised = confirmed + pending
        
        # Calculate waterfall (sequential funding)
        # Sort milestones by on_chain_id if available, otherwise milestone_id
        milestones = project.milestones.all().order_by('on_chain_id', 'milestone_id')
        remaining = total_raised
        funded_amount = 0
        for m in milestones:
            req = m.required_amount
            allocated = min(remaining, req)
            if m.pk == instance.pk:
                funded_amount = allocated
                break
            remaining -= allocated
        
        data['funded_amount'] = str(funded_amount)
        data['progress'] = float((funded_amount / instance.required_amount) * 100) if instance.required_amount > 0 else 0
        return data



class ProjectSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    goal_amount = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()
    is_syncing = serializers.SerializerMethodField()


    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = ('current_funding', 'status')

    def get_progress_percentage(self, obj):
        from django.db.models import Sum
        confirmed = obj.total_pledged or 0
        pending = obj.pledges.filter(status=0).aggregate(s=Sum('amount'))['s'] or 0
        total = confirmed + pending
        if obj.funding_goal > 0:
            return (total / obj.funding_goal) * 100
        return 0

    
    def get_goal_amount(self, obj):
        return str(obj.funding_goal)
    
    def get_currency(self, obj):
        return 'ETH'
    
    def get_is_syncing(self, obj):
        return obj.pledges.filter(status=0).exists()


    def to_representation(self, instance):
        from django.db.models import Sum
        data = super().to_representation(instance)
        # Override total_pledged to include pending
        confirmed = instance.total_pledged or 0
        pending = instance.pledges.filter(status=0).aggregate(s=Sum('amount'))['s'] or 0
        data['total_pledged'] = str(confirmed + pending)
        return data


class PledgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pledge
        fields = "__all__"
        read_only_fields = ('transaction_hash', 'block_number', 'status')

class ReleaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Release
        fields = "__all__"

class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = "__all__"

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = "__all__"

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = "__all__"

class ProjectCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    funding_goal_eth = serializers.DecimalField(max_digits=18, decimal_places=8)
    deadline_timestamp = serializers.IntegerField()
    status = serializers.ChoiceField(choices=["active", "inactive"], required=False, default="active")

class MilestoneCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    target_amount = serializers.DecimalField(max_digits=18, decimal_places=8)
    due_date = serializers.DateTimeField(required=False, allow_null=True)

class PledgeCreateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=18, decimal_places=8, help_text="Amount to pledge in ETH")
    transaction_hash = serializers.CharField(max_length=255, required=False)

