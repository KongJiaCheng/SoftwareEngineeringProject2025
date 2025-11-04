from rest_framework import serializers
from .models import AssetMetadata

class AssetMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetMetadata
        fields = "__all__"
