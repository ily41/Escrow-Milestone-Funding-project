from rest_framework import serializers
from indexer.models import Project, Milestone, Pledge, Release, Refund, AuditLog, Vote

class MilestoneSerializer(serializers.ModelSerializer):
    approve_votes_count = serializers.SerializerMethodField()
    reject_votes_count = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Milestone
        fields = "__all__"
        read_only_fields = ('on_chain_id', 'transaction_hash', 'voting_session_id', 'status')

    def get_approve_votes_count(self, obj):
        return obj.votes.filter(approval=1).count()

    def get_reject_votes_count(self, obj):
        return obj.votes.filter(approval=0).count()

    def get_progress(self, obj):
        # Progress based on milestone funding
        # funded_amount removed from model, returning 0 for now
        return 0

class ProjectSerializer(serializers.ModelSerializer):
    # milestones = MilestoneSerializer(many=True, read_only=True, source='milestone_set')
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = ('on_chain_id', 'created_tx_hash', 'current_funding', 'status')

    def get_progress_percentage(self, obj):
        if obj.funding_goal > 0:
            return (obj.total_pledged / obj.funding_goal) * 100
        return 0

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
    required_amount = serializers.DecimalField(max_digits=18, decimal_places=8)

class PledgeCreateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=18, decimal_places=8, help_text="Amount to pledge in ETH")
