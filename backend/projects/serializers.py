"""
Serializers for project-related endpoints.
"""
from rest_framework import serializers
from .models import Project, Milestone, Update
from users.serializers import CreatorSerializer


class MilestoneSerializer(serializers.ModelSerializer):
    """Serializer for Milestone model."""
    approve_votes_count = serializers.ReadOnlyField()
    reject_votes_count = serializers.ReadOnlyField()

    class Meta:
        model = Milestone
        fields = (
            'id', 'project', 'title', 'description', 'target_amount',
            'order_index', 'status', 'due_date', 'created_at',
            'approve_votes_count', 'reject_votes_count'
        )
        read_only_fields = ('id', 'created_at', 'status')


class UpdateSerializer(serializers.ModelSerializer):
    """Serializer for Update model."""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Update
        fields = ('id', 'project', 'title', 'content', 'created_at', 'created_by', 'created_by_username')
        read_only_fields = ('id', 'created_at', 'created_by')


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model."""
    creator = CreatorSerializer(read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    updates = UpdateSerializer(many=True, read_only=True)
    total_pledged = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Project
        fields = (
            'id', 'creator', 'title', 'description', 'goal_amount', 'currency',
            'status', 'start_date', 'end_date', 'created_at', 'updated_at',
            'milestones', 'updates', 'total_pledged', 'progress_percentage'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'status')


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for project lists."""
    creator_display_name = serializers.CharField(source='creator.display_name', read_only=True)
    total_pledged = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    milestones_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            'id', 'title', 'description', 'goal_amount', 'currency',
            'status', 'start_date', 'end_date', 'created_at',
            'creator_display_name', 'total_pledged', 'progress_percentage',
            'milestones_count'
        )

    def get_milestones_count(self, obj):
        return obj.milestones.count()


