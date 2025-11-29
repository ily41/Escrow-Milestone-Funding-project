from django.contrib.auth.models import User
from rest_framework import serializers
from .models import WalletProfile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=WalletProfile.ROLE_CHOICES)

    class Meta:
        model = User
        fields = ("username", "email", "password", "role")

    def create(self, validated_data):
        role = validated_data.pop("role")
        user = User.objects.create_user(**validated_data)
        WalletProfile.objects.create(user=user, role=role)
        return user

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="wallet_profile.role", read_only=True)
    wallet_address = serializers.CharField(source="wallet_profile.wallet_address", read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "wallet_address")

class WalletLinkSerializer(serializers.Serializer):
    wallet_address = serializers.CharField(max_length=255)
