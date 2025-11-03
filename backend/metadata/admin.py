<<<<<<< HEAD
from django.contrib import admin
from .models import AssetMetadata

# View and edit metadata in the Admin panel
@admin.register(AssetMetadata) # modern way to register a model
class AssetMetadataAdmin(admin.ModelAdmin):
    list_display = ('asset_name', 'file_type', 'tags', 'created_at')
    search_fields = ('asset_name', 'tags')
    list_filter = ('file_type', 'created_at')

=======
from django.contrib import admin
from .models import AssetMetadata

# View and edit metadata in the Admin panel
@admin.register(AssetMetadata) # modern way to register a model
class AssetMetadataAdmin(admin.ModelAdmin):
    list_display = ('asset_name', 'file_type', 'tags', 'created_at')
    search_fields = ('asset_name', 'tags')
    list_filter = ('file_type', 'created_at')

>>>>>>> 49396cfbf75129b3ab146ef0a9b5d71c8b80bcad
