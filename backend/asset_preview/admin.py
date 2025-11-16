from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import PreviewAsset

@admin.register(PreviewAsset)
class PreviewAssetAdmin(admin.ModelAdmin):
    list_display = ("file_name", "file_type", "file_size", "preview_link", "download_link", "modified_at")
    search_fields = ("file_name", "description", "tags")
    list_filter = ("file_type",)

    def preview_link(self, obj):
        try:
            url = reverse("asset-preview-preview", args=[obj.pk])
            return format_html('<a target="_blank" href="{}">Preview</a>', url)
        except Exception:
            return "-"
    preview_link.short_description = "Preview"

    def download_link(self, obj):
        try:
            url = reverse("asset-preview-download", args=[obj.pk])
            return format_html('<a target="_blank" href="{}">Download</a>', url)
        except Exception:
            return "-"
    download_link.short_description = "Download"