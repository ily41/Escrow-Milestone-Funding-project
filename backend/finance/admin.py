from django.contrib import admin
from .models import Wallet, Pledge, Release, Refund


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('owner_type', 'owner_id', 'balance', 'currency', 'created_at')
    list_filter = ('owner_type', 'currency', 'created_at')
    search_fields = ('owner_id',)


@admin.register(Pledge)
class PledgeAdmin(admin.ModelAdmin):
    list_display = ('backer', 'project', 'amount', 'currency', 'status', 'created_at')
    list_filter = ('status', 'currency', 'created_at')
    search_fields = ('backer__username', 'project__title', 'payment_reference')


@admin.register(Release)
class ReleaseAdmin(admin.ModelAdmin):
    list_display = ('milestone', 'amount_released', 'released_to_wallet', 'released_at')
    list_filter = ('released_at',)
    search_fields = ('milestone__title', 'tx_reference')


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('pledge', 'milestone', 'amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('pledge__backer__username', 'reason')


