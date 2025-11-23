"""
Serializers for finance-related endpoints.
"""
from rest_framework import serializers
from .models import Wallet, Pledge, Release, Refund
from projects.serializers import ProjectListSerializer, MilestoneSerializer


class WalletSerializer(serializers.ModelSerializer):
    """Serializer for Wallet model."""
    class Meta:
        model = Wallet
        fields = ('id', 'owner_type', 'owner_id', 'balance', 'currency', 'created_at')
        read_only_fields = ('id', 'created_at', 'balance')


class PledgeSerializer(serializers.ModelSerializer):
    """Serializer for Pledge model."""
    project = ProjectListSerializer(read_only=True)
    backer_username = serializers.CharField(source='backer.username', read_only=True)

    class Meta:
        model = Pledge
        fields = (
            'id', 'project', 'backer', 'backer_username', 'amount', 'currency',
            'status', 'payment_reference', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'status')


class ReleaseSerializer(serializers.ModelSerializer):
    """Serializer for Release model."""
    milestone = MilestoneSerializer(read_only=True)

    class Meta:
        model = Release
        fields = (
            'id', 'milestone', 'amount_released', 'released_to_wallet',
            'released_at', 'tx_reference'
        )
        read_only_fields = ('id', 'released_at')


class RefundSerializer(serializers.ModelSerializer):
    """Serializer for Refund model."""
    pledge = PledgeSerializer(read_only=True)
    milestone = MilestoneSerializer(read_only=True)

    class Meta:
        model = Refund
        fields = (
            'id', 'pledge', 'milestone', 'amount', 'reason',
            'status', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'status')


