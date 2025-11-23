"""
Views for user-related endpoints.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.contrib.auth import get_user_model
from .models import Creator
from .serializers import UserSerializer, UserRegistrationSerializer, CreatorSerializer

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User model."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create' or self.action == 'register':
            return [AllowAny()]
        return super().get_permissions()

    @extend_schema(
        summary="Register a new user",
        description="Create a new user account. Set is_creator=True to also create a creator profile.",
        request=UserRegistrationSerializer,
        responses={201: {'description': 'User registered successfully'}},
    )
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Register a new user."""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user': UserSerializer(user).data,
                'message': 'User registered successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Get current user",
        description="Retrieve information about the currently authenticated user.",
        responses={200: UserSerializer},
    )
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user information."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class CreatorViewSet(viewsets.ModelViewSet):
    """ViewSet for Creator model."""
    queryset = Creator.objects.all()
    serializer_class = CreatorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_creator:
            return Creator.objects.filter(user=self.request.user)
        return Creator.objects.all()


