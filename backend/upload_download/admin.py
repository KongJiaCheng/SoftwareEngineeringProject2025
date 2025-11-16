from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import UploadAsset

@admin.register(UploadAsset)
class UploadAssetAdmin(admin.ModelAdmin):
    list_display = ("file_name", "file_type", "file_size","file_location", "download_link", "modified_at")
    search_fields = ("file_name", "description", "tags")
    list_filter = ("file_type",)
    readonly_fields = (
        "file_name", "file_type", "file_size", "file_location", "resolution",
        "duration", "polygon_count", "created_at", "modified_at", "modified_by"
    )

    def download_link(self, obj):
        try:
            url = reverse("asset_download", args=[obj.pk])
            return format_html('<a target="_blank" href="{}">Download</a>', url)
        except Exception:
            return "-"
    download_link.short_description = "Download"

