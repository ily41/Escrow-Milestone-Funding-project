from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema, OpenApiTypes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

from .serializers import RegisterSerializer, UserSerializer, WalletLinkSerializer
from .models import WalletProfile

@extend_schema(
    summary="Register a new user (creator or backer)",
    request=RegisterSerializer,
    responses=UserSerializer,
)
class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "user": UserSerializer(user).data,
                "detail": "Account created successfully"
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@extend_schema(
    summary="Login with username & password (returns JWT)",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {"type": "string"},
                "password": {"type": "string"},
            },
            "required": ["username", "password"],
        }
    },
    responses=OpenApiTypes.OBJECT,
)
class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        })

class MeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Get current user profile", responses=UserSerializer)
    def get(self, request):
        return Response(UserSerializer(request.user).data)

class LinkWalletView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Link wallet address", request=WalletLinkSerializer)
    def post(self, request):
        serializer = WalletLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        wallet_address = serializer.validated_data["wallet_address"]

        profile, _ = WalletProfile.objects.get_or_create(user=request.user)
        profile.wallet_address = wallet_address
        profile.save()

        return Response({"detail": "Wallet linked", "wallet_address": wallet_address})

class WalletDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Get linked wallet info")
    def get(self, request):
        try:
            profile = request.user.wallet_profile
            return Response({
                "wallet_address": profile.wallet_address,
                "role": profile.role,
            })
        except WalletProfile.DoesNotExist:
            return Response({"detail": "No wallet profile"}, status=status.HTTP_404_NOT_FOUND)
