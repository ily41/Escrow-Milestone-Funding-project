"""
URLs for governance-related endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VoteViewSet, AuditLogViewSet

router = DefaultRouter()
router.register(r'votes', VoteViewSet, basename='vote')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
]


