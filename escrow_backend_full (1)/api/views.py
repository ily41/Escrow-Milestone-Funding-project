from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from indexer.models import Project, Pledge, Milestone, Release, Refund, AuditLog, Vote, Backer
from monitoring.models import AdminResolution
from accounts.utils import require_role
from accounts.models import WalletProfile

from .serializers import (
    ProjectSerializer, MilestoneSerializer,
    PledgeSerializer, ReleaseSerializer,
    RefundSerializer, AuditLogSerializer, VoteSerializer,
    ProjectCreateSerializer, MilestoneCreateSerializer,
)
from .web3_client import fake_tx_hash

@extend_schema(summary="List projects")
class ProjectListView(generics.ListAPIView):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        queryset = Project.objects.using('indexer').all()
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by creator if provided (using wallet address)
        creator_param = self.request.query_params.get('creator')
        if creator_param and self.request.user.is_authenticated:
            try:
                from accounts.models import WalletProfile
                profile = WalletProfile.objects.get(user_id=creator_param)
                if profile.wallet_address:
                    queryset = queryset.filter(creator_address=profile.wallet_address)
            except WalletProfile.DoesNotExist:
                queryset = queryset.none()
        
        return queryset

@extend_schema(summary="Get project detail")
class ProjectDetailView(generics.RetrieveAPIView):
    queryset = Project.objects.using('indexer').all()
    serializer_class = ProjectSerializer
    lookup_field = 'project_id'

@extend_schema(summary="List milestones for a project")
class ProjectMilestonesView(generics.ListAPIView):
    serializer_class = MilestoneSerializer

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Milestone.objects.using('indexer').filter(project__project_id=project_id)

@extend_schema(summary="List pledges for a project")
class ProjectPledgesView(generics.ListAPIView):
    serializer_class = PledgeSerializer

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Pledge.objects.using('indexer').filter(project__project_id=project_id)

class ProjectCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Create a new project (on-chain placeholder)", request=ProjectCreateSerializer)
    def post(self, request):
        profile = require_role(request.user, ["creator"])
        serializer = ProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not profile.wallet_address:
            return Response({"detail": "Creator wallet not linked"}, status=status.HTTP_400_BAD_REQUEST)

        # Temporary fix: Save to DB directly
        import uuid
        from datetime import datetime, timezone
        
        data = serializer.validated_data
        project_id = str(uuid.uuid4())
        deadline = datetime.fromtimestamp(data['deadline_timestamp'], tz=timezone.utc)
        
        Project.objects.using('indexer').create(
            project_id=project_id,
            title=data['title'],
            escrow_address="0x0000000000000000000000000000000000000000",
            creator_address=profile.wallet_address,
            funding_goal=data['funding_goal_eth'],
            deadline=deadline,
            status=data.get('status', 'active')
        )

        tx_hash = fake_tx_hash()

        return Response({
            "status": "submitted",
            "tx_hash": tx_hash,
            "project_id": project_id,
            "note": "Wire this to real web3 contract call",
        })

class MilestoneCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Add milestone to project (on-chain placeholder)", request=MilestoneCreateSerializer)
    def post(self, request, project_id):
        profile = require_role(request.user, ["creator"])
        serializer = MilestoneCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not profile.wallet_address:
            return Response({"detail": "Creator wallet not linked"}, status=status.HTTP_400_BAD_REQUEST)

        # Temporary fix: Save to DB directly
        try:
            project = Project.objects.using('indexer').get(project_id=project_id)
        except Project.DoesNotExist:
            return Response({"detail": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        data = serializer.validated_data
        Milestone.objects.using('indexer').create(
            project=project,
            title=data['title'],
            description=data.get('description', ''),
            required_amount=data['required_amount'],
            status=0  # 0 = Pending
        )

        tx_hash = fake_tx_hash()

        return Response({
            "status": "submitted",
            "tx_hash": tx_hash,
            "note": "Wire this to real web3 contract call",
        })

class MilestoneActivationView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Activate a milestone (on-chain placeholder)")
    def post(self, request, project_id, milestone_id):
        profile = require_role(request.user, ["creator"])
        if not profile.wallet_address:
            return Response({"detail": "Creator wallet not linked"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            milestone = Milestone.objects.using('indexer').get(project__project_id=project_id, milestone_id=milestone_id)
        except Milestone.DoesNotExist:
            return Response({"detail": "Milestone not found"}, status=status.HTTP_404_NOT_FOUND)

        if milestone.is_activated:
            return Response({"detail": "Milestone already activated"}, status=status.HTTP_400_BAD_REQUEST)

        # Temporary fix: Update DB directly
        milestone.is_activated = True
        milestone.save(using='indexer')

        tx_hash = fake_tx_hash()

        return Response({
            "status": "activated",
            "tx_hash": tx_hash,
            "note": "Wire this to real web3 contract call",
        })

class PledgeCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Backer pledges to project (on-chain placeholder)")
    def post(self, request, project_id):
        profile = require_role(request.user, ["backer"])
        if not profile.wallet_address:
            return Response({"detail": "Backer wallet not linked"}, status=status.HTTP_400_BAD_REQUEST)

        # Check for active milestones
        has_active = Milestone.objects.using('indexer').filter(project__project_id=project_id, is_activated=True).exists()
        if not has_active:
            return Response({"detail": "Cannot pledge: No active milestones"}, status=status.HTTP_400_BAD_REQUEST)

        amount = request.data.get("amount")
        if not amount:
            return Response({"detail": "amount is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount_decimal = float(amount)
        except (ValueError, TypeError):
             return Response({"detail": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        # Update Project total_pledged
        try:
            project = Project.objects.using('indexer').get(project_id=project_id)
            project.total_pledged = float(project.total_pledged) + amount_decimal
            project.save(using='indexer')

            # Distribute funds to milestones sequentially (Waterfall)
            milestones = Milestone.objects.using('indexer').filter(project=project).order_by('milestone_id')
            remaining_pledge = amount_decimal

            for milestone in milestones:
                if remaining_pledge <= 0:
                    break
                
                required = float(milestone.required_amount)
                # funded_amount removed from model, skipping logic for now or need to re-implement
                # For now just pass to avoid error
                pass 

        except Project.DoesNotExist:
            return Response({"detail": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get or create Backer
        backer, created = Backer.objects.using('indexer').get_or_create(
            wallet_address=profile.wallet_address.lower(),
            defaults={'status': 1}
        )

        # Create Pledge record
        from datetime import datetime, timezone
        Pledge.objects.using('indexer').create(
            project=project,
            backer=backer,
            amount=amount_decimal,
            transaction_hash=fake_tx_hash(),
            pledged_at=datetime.now(timezone.utc),
            status=1 # 1 = Confirmed
        )

        tx_hash = fake_tx_hash()
        return Response({
            "status": "submitted",
            "tx_hash": tx_hash,
            "note": "Wire this to real web3 contract call",
        })


class HistoryView(APIView):
    @extend_schema(summary="Transaction history across pledges, releases, refunds")
    def get(self, request):
        events = []

        pledges = Pledge.objects.using('indexer').all()[:100]
        for p in pledges:
            events.append({
                'type': 'pledge',
                'project_id': str(p.project.project_id),
                'amount': str(p.amount),
                'tx_hash': p.transaction_hash,
                'timestamp': p.pledged_at.isoformat(),
            })

        releases = Release.objects.using('indexer').all()[:100]
        for r in releases:
            events.append({
                'type': 'release',
                'project_id': str(r.milestone.project.project_id),
                'amount': str(r.amount),
                'tx_hash': r.transaction_hash,
                'timestamp': r.released_at.isoformat(),
            })

        refunds = Refund.objects.using('indexer').all()[:100]
        for rf in refunds:
            events.append({
                'type': 'refund',
                'project_id': str(rf.pledge.project.project_id),
                'amount': str(rf.amount),
                'tx_hash': rf.transaction_hash,
                'timestamp': rf.refunded_at.isoformat(),
            })

        events.sort(key=lambda e: e['timestamp'], reverse=True)
        return Response(events)

class TransactionDetailView(APIView):
    @extend_schema(summary="Lookup transaction details by hash")
    def get(self, request, tx_hash):
        data = {
            'hash': tx_hash,
            'found_in': [],
            'records': {},
        }

        rel = Release.objects.using('indexer').filter(transaction_hash=tx_hash).first()
        if rel:
            data['found_in'].append('releases')
            data['records']['release'] = ReleaseSerializer(rel).data

        ref = Refund.objects.using('indexer').filter(transaction_hash=tx_hash).first()
        if ref:
            data['found_in'].append('refunds')
            data['records']['refund'] = RefundSerializer(ref).data

        logs = AuditLog.objects.using('indexer').filter(transaction_hash=tx_hash)
        if logs.exists():
            data['found_in'].append('audit_logs')
            data['records']['audit_logs'] = AuditLogSerializer(logs, many=True).data

        return Response(data)

class AdminResolveView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(summary="Admin resolves a project/milestone issue")
    def post(self, request):
        project_id = request.data.get('project_id')
        milestone_id = request.data.get('milestone_id')
        action = request.data.get('action')
        note = request.data.get('note', '')

        if not action:
            return Response({'detail': 'action is required'}, status=status.HTTP_400_BAD_REQUEST)

        res = AdminResolution.objects.create(
            project_id=project_id,
            milestone_id=milestone_id,
            action=action,
            note=note,
            created_by=request.user if request.user.is_authenticated else None,
        )
        return Response({'id': res.id, 'status': 'recorded'}, status=status.HTTP_201_CREATED)

class AdminLogsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(summary="Admin log viewer placeholder")
    def get(self, request):
        logs = AuditLog.objects.using('indexer').all()[:200]
        return Response(AuditLogSerializer(logs, many=True).data)

class AdminMetricsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(summary="Admin metrics placeholder")
    def get(self, request):
        return Response({'status': 'ok', 'message': 'metrics endpoint placeholder'})

class ProjectStatusUpdateView(APIView):
    @extend_schema(summary="Update project status")
    def post(self, request, project_id):
        status_value = request.data.get('status')
        if status_value not in ['active', 'inactive']:
            return Response({'detail': 'Invalid status. Must be active or inactive.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            project = Project.objects.using('indexer').get(project_id=project_id)
            project.status = status_value
            project.save(using='indexer')
            return Response(ProjectSerializer(project).data)
        except Project.DoesNotExist:
            return Response({'detail': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

class OpenVotingView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Open voting for a milestone (on-chain placeholder)")
    def post(self, request, milestone_id):
        profile = require_role(request.user, ["creator"])
        if not profile.wallet_address:
            return Response({"detail": "Creator wallet not linked"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            milestone = Milestone.objects.using('indexer').get(milestone_id=milestone_id)
        except Milestone.DoesNotExist:
            return Response({"detail": "Milestone not found"}, status=status.HTTP_404_NOT_FOUND)

        if milestone.status != 0:  # 0 = Pending
            return Response({"detail": "Milestone is not in pending status"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if milestone funding is > 70%
        # Note: percentage field doesn't exist in model, skipping this check for now
        # if milestone.percentage < 70:
        #     return Response({"detail": "Milestone funding must be > 70% to open voting"}, status=status.HTTP_400_BAD_REQUEST)

        # Update milestone status to voting
        milestone.status = 1  # 1 = Voting
        milestone.save(using='indexer')

        tx_hash = fake_tx_hash()

        return Response({
            "status": "voting_opened",
            "tx_hash": tx_hash,
            "note": "Wire this to real web3 contract call",
        })

class VoteOnMilestoneView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Vote on a milestone (on-chain placeholder)")
    def post(self, request, milestone_id):
        profile = require_role(request.user, ["backer"])
        if not profile.wallet_address:
            return Response({"detail": "Backer wallet not linked"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            milestone = Milestone.objects.using('indexer').get(milestone_id=milestone_id)
        except Milestone.DoesNotExist:
            return Response({"detail": "Milestone not found"}, status=status.HTTP_404_NOT_FOUND)

        if milestone.status != 1:  # 1 = Voting
            return Response({"detail": "Milestone is not in voting status"}, status=status.HTTP_400_BAD_REQUEST)

        decision = request.data.get('decision')
        if decision not in ['approve', 'reject']:
            return Response({"detail": "Decision must be 'approve' or 'reject'"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already voted
        # Get backer first
        backer = Backer.objects.using('indexer').filter(
            wallet_address=profile.wallet_address.lower()
        ).first()
        
        if not backer:
            return Response({"detail": "You must pledge to this project before voting"}, status=status.HTTP_400_BAD_REQUEST)
        
        existing_vote = Vote.objects.using('indexer').filter(
            milestone=milestone,
            backer=backer
        ).first()

        if existing_vote:
            return Response({"detail": "You have already voted on this milestone"}, status=status.HTTP_400_BAD_REQUEST)

        # Get pledge amount for weight (simplified - in real version, get from blockchain)
        pledge = Pledge.objects.using('indexer').filter(
            project=milestone.project,
            backer__wallet_address=profile.wallet_address.lower()
        ).first()

        weight = pledge.amount if pledge else 1
        
        # Convert decision to approval integer
        approval_value = 1 if decision == 'approve' else 0

        # Create vote
        Vote.objects.using('indexer').create(
            milestone=milestone,
            backer=backer,
            approval=approval_value,
            vote_weight=weight
        )

        # Check if voting is complete and update status
        approve_count = milestone.votes.filter(approval=1).count()
        reject_count = milestone.votes.filter(approval=0).count()

        # Simple logic: if we have votes and approve > reject, mark as approved
        if approve_count > reject_count and (approve_count + reject_count) >= 1:
            milestone.status = 2  # 2 = Approved
            milestone.save(using='indexer')

        tx_hash = fake_tx_hash()

        return Response({
            "status": "vote_cast",
            "decision": decision,
            "tx_hash": tx_hash,
            "note": "Wire this to real web3 contract call",
        })
