# backend/asset_preview/serializers.py
from rest_framework import serializers
from asset_metadata.models import AssetMetadata


class AssetMetadataLiteSerializer(serializers.ModelSerializer):
    tags = serializers.SerializerMethodField()
    modified_by_username = serializers.CharField(
        source="modified_by.username", read_only=True
    )

    def get_tags(self, obj):
        raw = getattr(obj, "tags", None)
        if raw is None:
            return []
        if isinstance(raw, (list, tuple)):
            return list(raw)
        parts = [p.strip() for p in str(raw).replace(";", ",").split(",")]
        return [p for p in parts if p]

    class Meta:
        model = AssetMetadata
        fields = [
            "id",
            "file_name",
            "file_type",
            "file_size",
            "file_location",
            "description",
            "tags",
            "no_of_versions",
            "created_at",
            "modified_at",
            "resolution",
            "polygon_count",
            "duration",
            "modified_by_id",
            "modified_by_username",
        ]
