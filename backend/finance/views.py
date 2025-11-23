"""
Views for finance-related endpoints.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.db import transaction
from decimal import Decimal
from .models import Wallet, Pledge, Release, Refund
from .serializers import WalletSerializer, PledgeSerializer, ReleaseSerializer, RefundSerializer
from projects.models import Project, Milestone
from users.models import Creator


class WalletViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Wallet model (read-only)."""
    queryset = Wallet.objects.all()
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return wallets for the current user."""
        user = self.request.user
        wallets = Wallet.objects.none()
        
        # Get creator wallet if user is a creator
        if user.is_creator:
            try:
                creator = user.creator_profile
                wallets = wallets | Wallet.objects.filter(
                    owner_type='creator',
                    owner_id=creator.id
                )
            except:
                pass
        
        # Get backer wallet
        wallets = wallets | Wallet.objects.filter(
            owner_type='backer',
            owner_id=user.id
        )
        
        return wallets


class PledgeViewSet(viewsets.ModelViewSet):
    """ViewSet for Pledge model."""
    queryset = Pledge.objects.all()
    serializer_class = PledgeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return pledges for the current user or filter by project."""
        queryset = Pledge.objects.filter(backer=self.request.user)
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        """Create pledge and update escrow."""
        project = serializer.validated_data['project']
        
        # Validate project is active
        if project.status != 'active':
            raise serializers.ValidationError('Can only pledge to active projects')
        
        # Create pledge
        pledge = serializer.save(backer=self.request.user)
        
        # Note: In a real system, we'd process payment here
        # For now, we just create the pledge record
        # The escrow is represented by the sum of active pledges


class ReleaseViewSet(viewsets.ModelViewSet):
    """ViewSet for Release model."""
    queryset = Release.objects.all()
    serializer_class = ReleaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return releases filtered by milestone or project."""
        queryset = Release.objects.all()
        milestone_id = self.request.query_params.get('milestone', None)
        if milestone_id:
            queryset = queryset.filter(milestone_id=milestone_id)
        return queryset

    @extend_schema(
        summary="Release funds for milestone",
        description="Release funds from escrow to the creator's wallet for an approved milestone. Only approved milestones can have funds released.",
        responses={201: ReleaseSerializer},
    )
    @transaction.atomic
    @action(detail=False, methods=['post'], url_path='milestone/(?P<milestone_id>[^/.]+)')
    def release_for_milestone(self, request, milestone_id=None):
        """Release funds for an approved milestone."""
        try:
            milestone = Milestone.objects.get(id=milestone_id)
        except Milestone.DoesNotExist:
            return Response(
                {'error': 'Milestone not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if milestone is approved
        if milestone.status != 'approved':
            return Response(
                {'error': 'Can only release funds for approved milestones'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already released
        if milestone.releases.exists():
            return Response(
                {'error': 'Funds already released for this milestone'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get creator wallet
        creator = milestone.project.creator
        wallet = Wallet.get_or_create_wallet('creator', creator.id, milestone.project.currency)

        # Calculate amount to release (milestone target amount)
        amount = milestone.target_amount

        # Create release
        release = Release.objects.create(
            milestone=milestone,
            amount_released=amount,
            released_to_wallet=wallet
        )

        # Update wallet balance
        wallet.balance += amount
        wallet.save()

        # Update milestone status
        milestone.status = 'paid'
        milestone.save()

        # Check if project should be marked as funded
        project = milestone.project
        if all(m.status in ['paid', 'approved'] for m in project.milestones.all()):
            if project.total_pledged >= project.goal_amount:
                project.status = 'funded'
                project.save()

        return Response(ReleaseSerializer(release).data, status=status.HTTP_201_CREATED)


class RefundViewSet(viewsets.ModelViewSet):
    """ViewSet for Refund model."""
    queryset = Refund.objects.all()
    serializer_class = RefundSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return refunds for the current user's pledges."""
        return Refund.objects.filter(pledge__backer=self.request.user)

    @transaction.atomic
    def perform_create(self, serializer):
        """Create refund request."""
        pledge = serializer.validated_data['pledge']
        
        # Validate pledge belongs to user
        if pledge.backer != self.request.user:
            raise serializers.ValidationError('Can only request refunds for your own pledges')
        
        # Validate pledge is active
        if pledge.status != 'active':
            raise serializers.ValidationError('Can only refund active pledges')
        
        # Create refund
        refund = serializer.save()
        
        # Auto-process refund if milestone is rejected or project failed
        milestone = refund.milestone
        if milestone and milestone.status == 'rejected':
            self._process_refund(refund)
        elif refund.pledge.project.status in ['failed', 'cancelled']:
            self._process_refund(refund)

    def _process_refund(self, refund):
        """Process a refund by updating balances."""
        # Get backer wallet
        wallet = Wallet.get_or_create_wallet(
            'backer',
            refund.pledge.backer.id,
            refund.pledge.currency
        )
        
        # Update wallet balance
        wallet.balance += refund.amount
        wallet.save()
        
        # Update pledge status
        refund.pledge.status = 'refunded'
        refund.pledge.save()
        
        # Update refund status
        refund.status = 'processed'
        refund.save()

    @extend_schema(
        summary="Process a refund",
        description="Manually process a refund request. Only admins can process refunds.",
        responses={200: {'description': 'Refund processed successfully'}},
    )
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Manually process a refund (admin action)."""
        refund = self.get_object()
        
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can process refunds'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if refund.status != 'requested':
            return Response(
                {'error': 'Refund already processed or rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self._process_refund(refund)
        return Response({'status': 'Refund processed'})


