from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from indexer.models import Project, Pledge, Milestone, Release, Refund, AuditLog
from monitoring.models import AdminResolution
from accounts.utils import require_role
from accounts.models import WalletProfile

from .serializers import (
    ProjectSerializer, MilestoneSerializer,
    PledgeSerializer, ReleaseSerializer,
    RefundSerializer, AuditLogSerializer,
    ProjectCreateSerializer, MilestoneCreateSerializer,
)
from .web3_client import fake_tx_hash

@extend_schema(summary="List projects")
class ProjectListView(generics.ListAPIView):
    queryset = Project.objects.using('indexer').all()
    serializer_class = ProjectSerializer

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
            percentage=data['percentage'],
            status="pending"
        )

        tx_hash = fake_tx_hash()

        return Response({
            "status": "submitted",
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

        amount = request.data.get("amount")
        if not amount:
            return Response({"detail": "amount is required"}, status=status.HTTP_400_BAD_REQUEST)

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

