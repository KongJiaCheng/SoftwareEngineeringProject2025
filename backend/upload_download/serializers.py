from rest_framework import serializers
from asset_metadata.models import AssetMetadata

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetMetadata
        fields = "__all__"
        read_only_fields = (
            "file_name",
            "file_type",
            "file_size",
            "file_location",
            "resolution",     # always auto-filled, never editable
            "duration",       # always auto-filled, never editable
            "created_at",
            "modified_at",
            "modified_by",
        )


    def validate(self, attrs):
        # Prevent client from smuggling type-specific fields
        instance = getattr(self, "instance", None)
        ftype = (instance.file_type if instance else attrs.get("file_type", "")) or ""

        if "duration" in attrs and "video" not in ftype:
            raise serializers.ValidationError({"duration": "Duration only applies to video files."})
        if "polygon_count" in attrs and not ftype.endswith("model/gltf-binary") and not ftype.endswith("/glb"):
            raise serializers.ValidationError({"polygon_count": "Polygon count only applies to .glb files."})
        return attrs
