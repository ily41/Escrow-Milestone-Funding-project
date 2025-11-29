from django.urls import path
from .views import RegisterView, LoginView, MeView, LinkWalletView, WalletDetailView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("me/", MeView.as_view()),
    path("wallet/link/", LinkWalletView.as_view()),
    path("wallet/", WalletDetailView.as_view()),
]
