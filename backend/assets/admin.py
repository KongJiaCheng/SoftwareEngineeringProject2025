from django.contrib import admin
from .models import Asset

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('id', 'uploaded_by', 'created_at')
    search_fields = ('name', 'tags')
    list_filter = ('created_at',)
