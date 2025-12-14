"""
URLs for project-related endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, MilestoneViewSet, UpdateViewSet

router = DefaultRouter()
router.register(r'milestones', MilestoneViewSet, basename='milestone')
router.register(r'updates', UpdateViewSet, basename='update')
router.register(r'', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
]


