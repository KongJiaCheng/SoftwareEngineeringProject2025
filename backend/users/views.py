from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Asset, AssetVersion, Tag
from .serializers import AssetSerializer, AssetVersionSerializer, TagSerializer
from .permissions import IsAdminOrEditor

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all().order_by("-created_at")
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminOrEditor])
    def upload_version(self, request, pk=None):
        asset = self.get_object()
        f = request.FILES.get("file")
        if not f:
            return Response({"detail": "file required"}, status=status.HTTP_400_BAD_REQUEST)
        # create a new version record; file saving handled separately (S3 or local)
        v_num = asset.versions.count() + 1
        av = AssetVersion.objects.create(asset=asset, filename=f.name,
                                         content_type=f.content_type, size=f.size,
                                         version_number=v_num, file_path="uploads/temp/"+f.name)
        # Save the file to storage (example: default storage)
        from django.core.files.storage import default_storage
        path = default_storage.save(f"assets/{asset.id}/{av.id}/{f.name}", f)
        av.file_path = path
        av.save()
        # enqueue processing task (thumbnail extraction)
        from .tasks import process_asset_version
        process_asset_version.delay(av.id)
        return Response(AssetVersionSerializer(av).data, status=201)

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
