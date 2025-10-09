from rest_framework import serializers
from .models import Asset

class AssetSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.ReadOnlyField(source="uploaded_by.username")

    class Meta:
        model = Asset
        fields = "__all__"
