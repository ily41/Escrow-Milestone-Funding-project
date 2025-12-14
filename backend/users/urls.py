"""
URLs for user-related endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, CreatorViewSet

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')
router.register(r'creators', CreatorViewSet, basename='creator')

urlpatterns = [
    path('', include(router.urls)),
]


