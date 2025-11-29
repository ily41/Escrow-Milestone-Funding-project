from rest_framework.exceptions import PermissionDenied
from .models import WalletProfile

def require_role(user, allowed_roles):
    try:
        profile = user.wallet_profile
    except WalletProfile.DoesNotExist:
        raise PermissionDenied("No wallet profile configured")

    if profile.role not in allowed_roles:
        raise PermissionDenied(f"Requires role in {allowed_roles}, you are '{profile.role}'")
    return profile
