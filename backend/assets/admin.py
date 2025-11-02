from django.contrib import admin
from .models import Asset

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'uploaded_by', 'created_at')
    search_fields = ('title', 'tags')
    list_filter = ('created_at','asset_type')
