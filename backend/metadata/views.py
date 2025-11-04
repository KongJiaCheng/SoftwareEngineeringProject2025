from rest_framework import viewsets, permissions
from .models import AssetMetadata
from .serializers import AssetMetadataSerializer

class AssetMetadataViewSet(viewsets.ModelViewSet):  # ViewSet for asset metadata
    queryset = AssetMetadata.objects.all().order_by("-created_at")
    serializer_class = AssetMetadataSerializer
    permission_classes = [permissions.AllowAny]
