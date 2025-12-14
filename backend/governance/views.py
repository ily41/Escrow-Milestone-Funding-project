"""
Views for governance-related endpoints.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from drf_spectacular.utils import extend_schema
from django.db import transaction
from .models import Vote, AuditLog
from .serializers import VoteSerializer, AuditLogSerializer
from projects.models import Milestone
from finance.models import Pledge


class VoteViewSet(viewsets.ModelViewSet):
    """ViewSet for Vote model."""
    queryset = Vote.objects.all()
    serializer_class = VoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return votes for the current user or filter by milestone."""
        queryset = Vote.objects.filter(backer=self.request.user)
        milestone_id = self.request.query_params.get('milestone', None)
        if milestone_id:
            queryset = Vote.objects.filter(milestone_id=milestone_id)
        return queryset

    @extend_schema(
        summary="Vote on a milestone",
        description="Submit a vote (approve or reject) for a milestone that is currently in voting status. Only backers with active pledges can vote.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'milestone': {'type': 'integer', 'description': 'Milestone ID'},
                    'decision': {'type': 'string', 'enum': ['approve', 'reject'], 'description': 'Vote decision'},
                },
                'required': ['milestone', 'decision'],
            }
        },
        responses={201: VoteSerializer},
    )
    @transaction.atomic
    def perform_create(self, serializer):
        """Create vote and check if milestone should be approved/rejected."""
        milestone = serializer.validated_data['milestone']
        
        # Validate milestone is in voting status
        if milestone.status != 'voting':
            raise serializers.ValidationError('Milestone is not open for voting')
        
        # Validate backer has an active pledge for this project
        has_pledge = Pledge.objects.filter(
            project=milestone.project,
            backer=self.request.user,
            status='active'
        ).exists()
        
        if not has_pledge:
            raise serializers.ValidationError('You must have an active pledge to vote')
        
        # Create or update vote
        vote, created = Vote.objects.update_or_create(
            milestone=milestone,
            backer=self.request.user,
            defaults={'decision': serializer.validated_data['decision']}
        )
        
        # Check voting results
        self._check_voting_results(milestone)

    def _check_voting_results(self, milestone):
        """Check if milestone should be approved or rejected based on votes."""
        approve_count = milestone.approve_votes_count
        reject_count = milestone.reject_votes_count
        
        # Simple majority rule: approve if more approve votes than reject votes
        # At least one vote required
        total_votes = approve_count + reject_count
        if total_votes == 0:
            return
        
        # Get all backers who have pledged
        total_backers = Pledge.objects.filter(
            project=milestone.project,
            status='active'
        ).values('backer').distinct().count()
        
        # Simple rule: if approve > reject, approve
        # Could also add threshold like "at least 50% of backers voted"
        if approve_count > reject_count:
            milestone.status = 'approved'
            milestone.save()
        elif reject_count > approve_count:
            milestone.status = 'rejected'
            milestone.save()
            # Trigger refund logic for rejected milestone
            self._handle_rejected_milestone(milestone)

    def _handle_rejected_milestone(self, milestone):
        """Handle refunds when a milestone is rejected."""
        # This could trigger automatic refunds for future milestones
        # For now, we just mark it as rejected
        # Backers can manually request refunds
        pass


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for AuditLog model (read-only for admins)."""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """Filter audit logs by entity type if provided."""
        queryset = AuditLog.objects.all()
        entity_type = self.request.query_params.get('entity_type', None)
        actor_type = self.request.query_params.get('actor_type', None)
        
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        if actor_type:
            queryset = queryset.filter(actor_type=actor_type)
        
        return queryset


