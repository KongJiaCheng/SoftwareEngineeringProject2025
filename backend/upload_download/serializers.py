from rest_framework import serializers
# from .models import Asset, AssetVersion
from metadata.models import AssetMetadata   


class AssetSerializer(serializers.ModelSerializer):  # Serializer for Asset model
    class Meta:
        model = AssetMetadata
        fields = "__all__"
