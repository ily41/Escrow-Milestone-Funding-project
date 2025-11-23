from django.contrib import admin
from .models import Vote, AuditLog


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('backer', 'milestone', 'decision', 'created_at')
    list_filter = ('decision', 'created_at')
    search_fields = ('backer__username', 'milestone__title')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('actor_type', 'actor_id', 'action', 'entity_type', 'entity_id', 'created_at')
    list_filter = ('actor_type', 'entity_type', 'created_at')
    search_fields = ('action',)


