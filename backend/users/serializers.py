from rest_framework import serializers
from .models import Asset, AssetVersion, Tag

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id","name")

class AssetVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetVersion
        fields = ("id","filename","file_path","content_type","size","created_at","version_number","preview","processed")

class AssetSerializer(serializers.ModelSerializer):
    versions = AssetVersionSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, required=False)

    class Meta:
        model = Asset
        fields = ("id","title","description","owner","tags","metadata","created_at","updated_at","versions")

    def create(self, validated_data):
        tags_data = self.initial_data.get("tags", [])
        asset = Asset.objects.create(**validated_data)
        for t in tags_data:
            tag, _ = Tag.objects.get_or_create(name=t.get("name") if isinstance(t, dict) else t)
            asset.tags.add(tag)
        return asset
