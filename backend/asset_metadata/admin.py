from django.contrib import admin
from .models import AssetMetadata

# View and edit metadata in the Admin panel
'''
@admin.register(AssetMetadata) # modern way to register a model
class AssetMetadataAdmin(admin.ModelAdmin):
    #list_display = ('asset_name', 'file_type', 'tags', 'created_at')
    #search_fields = ('asset_name', 'tags')
    #list_filter = ('file_type', 'created_at')


    list_display = ("asset_name", "file_type", "file_size", "dimensions", "duration")
    readonly_fields = ("file_type", "file_size", "resolution", "duration", "dimensions")
'''
@admin.register(AssetMetadata)
class AssetMetadataAdmin(admin.ModelAdmin):
    list_display = (
        "file_name", "file_type", "file_size",
        "polygon_count", "duration", "no_of_versions",
        "created_at","modified_at", "modified_by"
    )