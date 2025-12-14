"""
Serializers for user-related endpoints.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Creator


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_creator', 'is_backer', 'is_admin', 'created_at')
        read_only_fields = ('id', 'created_at')


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'is_creator', 'is_backer')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_creator=validated_data.get('is_creator', False),
            is_backer=validated_data.get('is_backer', True),
        )
        
        # Create creator profile if user is a creator
        if user.is_creator:
            Creator.objects.create(
                user=user,
                display_name=user.username
            )
        
        return user


class CreatorSerializer(serializers.ModelSerializer):
    """Serializer for Creator model."""
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Creator
        fields = ('id', 'user', 'user_id', 'display_name', 'bio', 'created_at')
        read_only_fields = ('id', 'created_at')


