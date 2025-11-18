from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import PreviewAsset


@admin.register(PreviewAsset)
class PreviewAssetAdmin(admin.ModelAdmin):
    list_display = (
        "file_name",
        "file_type",
        "file_size",
        "preview_link",          # JSON preview
        "modified_by_id",
        "modified_by_username",
        "modified_at",
    )
    search_fields = ("file_name", "description", "tags")
    list_filter = ("file_type",)

    # Open JSON preview page
    def preview_link(self, obj):
        url = reverse("asset-preview-preview", args=[obj.pk])
        return format_html('<a target="_blank" href="{}">Preview</a>', url)

    preview_link.short_description = "Preview"

    def modified_by_username(self, obj):
        user = getattr(obj, "modified_by", None)
        return getattr(user, "username", None) if user else None

    modified_by_username.short_description = "Modified by (username)"
