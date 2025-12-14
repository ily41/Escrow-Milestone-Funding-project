"""
URLs for finance-related endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WalletViewSet, PledgeViewSet, ReleaseViewSet, RefundViewSet

router = DefaultRouter()
router.register(r'wallets', WalletViewSet, basename='wallet')
router.register(r'pledges', PledgeViewSet, basename='pledge')
router.register(r'releases', ReleaseViewSet, basename='release')
router.register(r'refunds', RefundViewSet, basename='refund')

urlpatterns = [
    path('', include(router.urls)),
]


