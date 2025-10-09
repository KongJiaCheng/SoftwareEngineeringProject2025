from rest_framework import viewsets, filters, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Asset
from .serializers import AssetSerializer
from .permissions import IsAdminOrEditor

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all().order_by("-created_at")
    serializer_class = AssetSerializer
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "tags", "description"]
    ordering_fields = ["created_at"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [IsAdminOrEditor]
        else:
            permission_classes = [permissions.AllowAny]
        return [p() for p in permission_classes]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
