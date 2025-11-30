from rest_framework import serializers
from indexer.models import Project, Milestone, Pledge, Release, Refund, AuditLog

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = "__all__"

class ProjectSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True, source='milestone_set')

    class Meta:
        model = Project
        fields = "__all__"

class PledgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pledge
        fields = "__all__"

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

class ProjectCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    funding_goal_eth = serializers.DecimalField(max_digits=18, decimal_places=8)
    deadline_timestamp = serializers.IntegerField()
    status = serializers.ChoiceField(choices=["active", "inactive"], required=False, default="active")

class MilestoneCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    percentage = serializers.IntegerField(min_value=1, max_value=100)
