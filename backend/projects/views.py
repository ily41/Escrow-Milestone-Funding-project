"""
Views for project-related endpoints.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.db.models import Q
from .models import Project, Milestone, Update
from .serializers import ProjectSerializer, ProjectListSerializer, MilestoneSerializer, UpdateSerializer
from users.models import Creator


@extend_schema_view(
    list=extend_schema(
        summary="List all projects",
        description="Retrieve a list of projects with optional filtering by status, creator, or search query.",
    ),
    retrieve=extend_schema(
        summary="Get project details",
        description="Retrieve detailed information about a specific project including milestones and updates.",
    ),
    create=extend_schema(
        summary="Create a new project",
        description="Create a new project. The project will be in 'draft' status and must be activated before it's visible to backers.",
    ),
    update=extend_schema(
        summary="Update a project",
        description="Update an existing project. Only the creator can update their own projects.",
    ),
    destroy=extend_schema(
        summary="Delete a project",
        description="Delete a project. Only the creator can delete their own projects.",
    ),
)
class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for Project model."""
    queryset = Project.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer

    def get_queryset(self):
        queryset = Project.objects.all()
        status_filter = self.request.query_params.get('status', None)
        creator_id = self.request.query_params.get('creator', None)
        search = self.request.query_params.get('search', None)

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if creator_id:
            queryset = queryset.filter(creator_id=creator_id)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        """Create project and associate with creator."""
        creator, _ = Creator.objects.get_or_create(user=self.request.user)
        serializer.save(creator=creator)

    @extend_schema(
        summary="Activate a project",
        description="Activate a draft project, making it visible to backers. Only the creator can activate their own projects.",
        responses={200: {'description': 'Project activated successfully'}},
    )
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a draft project."""
        project = self.get_object()
        if project.creator.user != request.user:
            return Response(
                {'error': 'Only the creator can activate this project'},
                status=status.HTTP_403_FORBIDDEN
            )
        if project.status != 'draft':
            return Response(
                {'error': 'Only draft projects can be activated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        project.status = 'active'
        project.save()
        return Response({'status': 'Project activated'})

    @extend_schema(
        summary="Deactivate a project",
        description="Deactivate an active project, returning it to draft status. Only the creator can deactivate their own projects.",
        responses={200: {'description': 'Project deactivated successfully'}},
    )
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate an active project."""
        project = self.get_object()
        if project.creator.user != request.user:
            return Response(
                {'error': 'Only the creator can deactivate this project'},
                status=status.HTTP_403_FORBIDDEN
            )
        if project.status != 'active':
            return Response(
                {'error': 'Only active projects can be deactivated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        project.status = 'draft'
        project.save()
        return Response({'status': 'Project deactivated'})

    @extend_schema(
        summary="Create a pledge",
        description="Create a pledge (contribution) to an active project. The amount will be held in escrow.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'amount': {'type': 'number', 'description': 'Pledge amount'},
                    'currency': {'type': 'string', 'description': 'Currency code (defaults to project currency)'},
                    'payment_reference': {'type': 'string', 'description': 'Optional payment reference'},
                },
                'required': ['amount'],
            }
        },
        responses={201: {'description': 'Pledge created successfully'}},
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def pledge(self, request, pk=None):
        """Create a pledge for this project."""
        project = self.get_object()
        from finance.models import Pledge
        from finance.serializers import PledgeSerializer
        
        if project.status != 'active':
            return Response(
                {'error': 'Can only pledge to active projects'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PledgeSerializer(data={
            'project': project.id,
            'amount': request.data.get('amount'),
            'currency': request.data.get('currency', project.currency),
            'payment_reference': request.data.get('payment_reference', ''),
        })
        
        if serializer.is_valid():
            pledge = serializer.save(backer=request.user)
            return Response(PledgeSerializer(pledge).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Get my projects",
        description="Get all projects created by the current authenticated user.",
        responses={200: ProjectListSerializer(many=True)},
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_projects(self, request):
        """Get projects created by the current user."""
        if not hasattr(request.user, 'creator_profile'):
            return Response([], status=status.HTTP_200_OK)
        creator = request.user.creator_profile
        queryset = Project.objects.filter(creator=creator)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get project statistics",
        description="Retrieve statistics about a project including total pledged, backers count, and milestone status.",
        responses={200: {'description': 'Project statistics'}},
    )
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get project statistics."""
        project = self.get_object()
        from finance.models import Pledge
        from governance.models import Vote

        stats = {
            'total_pledged': float(project.total_pledged),
            'goal_amount': float(project.goal_amount),
            'progress_percentage': project.progress_percentage,
            'total_pledges': Pledge.objects.filter(project=project, status='active').count(),
            'total_backers': Pledge.objects.filter(project=project, status='active').values('backer').distinct().count(),
            'milestones': {
                'total': project.milestones.count(),
                'approved': project.milestones.filter(status='approved').count(),
                'rejected': project.milestones.filter(status='rejected').count(),
                'pending': project.milestones.filter(status='pending').count(),
                'voting': project.milestones.filter(status='voting').count(),
            }
        }
        return Response(stats)


class MilestoneViewSet(viewsets.ModelViewSet):
    """ViewSet for Milestone model."""
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Milestone.objects.all()
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    @action(detail=True, methods=['post'])
    def open_voting(self, request, pk=None):
        """Open voting for a milestone."""
        milestone = self.get_object()
        if milestone.project.creator.user != request.user:
            return Response(
                {'error': 'Only the creator can open voting'},
                status=status.HTTP_403_FORBIDDEN
            )
        if milestone.status != 'pending':
            return Response(
                {'error': 'Only pending milestones can be opened for voting'},
                status=status.HTTP_400_BAD_REQUEST
            )
        milestone.status = 'voting'
        milestone.save()
        return Response({'status': 'Voting opened'})


class UpdateViewSet(viewsets.ModelViewSet):
    """ViewSet for Update model."""
    queryset = Update.objects.all()
    serializer_class = UpdateSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Update.objects.all()
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        """Create update and associate with user."""
        serializer.save(created_by=self.request.user)

