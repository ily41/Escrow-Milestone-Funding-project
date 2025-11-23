"""
Serializers for governance-related endpoints.
"""
from rest_framework import serializers
from .models import Vote, AuditLog
from projects.serializers import MilestoneSerializer


class VoteSerializer(serializers.ModelSerializer):
    """Serializer for Vote model."""
    milestone = MilestoneSerializer(read_only=True)
    backer_username = serializers.CharField(source='backer.username', read_only=True)

    class Meta:
        model = Vote
        fields = ('id', 'milestone', 'backer', 'backer_username', 'decision', 'created_at')
        read_only_fields = ('id', 'created_at')


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model."""
    class Meta:
        model = AuditLog
        fields = (
            'id', 'actor_type', 'actor_id', 'action',
            'entity_type', 'entity_id', 'metadata', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


