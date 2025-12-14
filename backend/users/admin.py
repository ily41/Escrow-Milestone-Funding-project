from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Creator


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'is_creator', 'is_backer', 'is_admin', 'is_staff')
    list_filter = ('is_creator', 'is_backer', 'is_admin', 'is_staff', 'is_superuser')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Crowdfunding Roles', {'fields': ('is_creator', 'is_backer', 'is_admin')}),
    )


@admin.register(Creator)
class CreatorAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'user', 'created_at')
    search_fields = ('display_name', 'user__username', 'user__email')


