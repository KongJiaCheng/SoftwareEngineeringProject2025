# backend/asset_preview/serializers.py
from rest_framework import serializers
from asset_metadata.models import AssetMetadata

class AssetMetadataLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetMetadata
        fields = [
            "id", "file_name", "file_type", "file_size",
            "file_location", "description", "tags",
            "no_of_versions", "created_at", "modified_at",
        ]
