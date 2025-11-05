from rest_framework import serializers
from asset_metadata.model import Asset, AssetVersion, Tag

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']


class AssetVersionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = AssetVersion
        fields = [
            'id', 'version_number', 'comment', 'created_by',
            'created_by_name', 'created_at', 'file_size', 'mime_type'
        ]
        read_only_fields = ['id', 'created_at', 'file_size', 'mime_type']


class AssetSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    versions = AssetVersionSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            'id', 'file', 'original_filename', 'file_type', 'file_size',
            'mime_type', 'title', 'description', 'tags', 'created_at',
            'updated_at', 'created_by', 'created_by_name', 'thumbnail',
            'file_url', 'thumbnail_url', 'versions'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'file_size', 'mime_type', 'file_type'
        ]

    def get_file_url(self, obj):
        return obj.file.url if obj.file else None

    def get_thumbnail_url(self, obj):
        return obj.thumbnail.url if obj.thumbnail else None
