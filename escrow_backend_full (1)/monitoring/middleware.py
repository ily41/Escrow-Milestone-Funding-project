import time
from .models import RequestLog

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.time()
        response = self.get_response(request)
        duration = (time.time() - start) * 1000.0

        user = request.user if request.user.is_authenticated else None
        ip = request.META.get("REMOTE_ADDR")

        RequestLog.objects.create(
            path=request.path,
            method=request.method,
            status_code=response.status_code,
            ip_address=ip,
            user=user,
            duration_ms=duration,
        )
        return response
