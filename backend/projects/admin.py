from django.contrib import admin
from .models import Project, Milestone, Update


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'status', 'goal_amount', 'total_pledged', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'description', 'creator__display_name')
    readonly_fields = ('total_pledged', 'progress_percentage', 'created_at', 'updated_at')


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'order_index', 'status', 'target_amount', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'project__title')


@admin.register(Update)
class UpdateAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'created_at', 'created_by')
    list_filter = ('created_at',)
    search_fields = ('title', 'project__title', 'content')


