# backend/asset_preview/views.py
from pathlib import Path
from urllib.parse import urljoin
import mimetypes

from django.conf import settings
from django.http import FileResponse, Http404
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from asset_metadata.models import AssetMetadata
from .serializers import AssetMetadataLiteSerializer
from .utils import ensure_basic_info, build_previews

def _to_media_url(abs_or_rel_path: Path) -> str | None:
    """
    Convert absolute/relative filesystem path under MEDIA_ROOT to a public MEDIA_URL.
    Returns None if path is falsy.
    """
    if not abs_or_rel_path:
        return None
    media_root = Path(settings.MEDIA_ROOT).resolve()
    p = Path(abs_or_rel_path)
    rel = p.relative_to(media_root) if p.is_absolute() else Path(p)
    return urljoin(settings.MEDIA_URL, rel.as_posix())


# class AssetPreviewViewSet(viewsets.ModelViewSet):
#     """
#     API for listing/retrieving AssetMetadata, and performing preview/download/version actions.
#     """
#     queryset = AssetMetadata.objects.all().order_by("-modified_at", "-created_at")
#     serializer_class = AssetMetadataLiteSerializer
#     permission_classes = [IsAuthenticated]

#     # Ensure basic info is up-to-date on list (file_size/file_type), then serialize
#     def list(self, request, *args, **kwargs):
#         media_root = Path(settings.MEDIA_ROOT)
#         for meta in self.get_queryset():
#             ensure_basic_info(meta, media_root)
#         return super().list(request, *args, **kwargs)

class AssetPreviewViewSet(viewsets.ModelViewSet):
    queryset = AssetMetadata.objects.all().order_by("-modified_at", "-created_at")
    serializer_class = AssetMetadataLiteSerializer
    permission_classes = [IsAuthenticated]  # default: protect everything

    # ⬇ Public reads, private writes
    def get_permissions(self):
        public_actions = {"list", "retrieve", "preview", "download", "versions"}
        if getattr(self, "action", None) in public_actions:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    # GET /api/asset_preview/assets/{pk}/preview/
    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        meta = self.get_object()
        media_root = Path(settings.MEDIA_ROOT)
        ensure_basic_info(meta, media_root)
        previews = build_previews(meta, media_root)  # returns dict with absolute Paths

        thumb_url = _to_media_url(previews.get("thumbnail_path"))
        prev_url  = _to_media_url(previews.get("preview_path"))

        # 🔹 extra: serialize the asset itself
        asset_data = AssetMetadataLiteSerializer(
            meta, context={"request": request}
        ).data

        return Response(
            {
                "asset": asset_data,
                "previews": {
                    "kind": previews.get("kind"),
                    "thumbnail_url": thumb_url,
                    "preview_url": prev_url,
                },
            },
            status=status.HTTP_200_OK,
        )


    # GET /api/asset_preview/assets/{pk}/versions/
    @action(detail=True, methods=["get"])
    def versions(self, request, pk=None):
        """
        Example convention: MEDIA_ROOT/versions/<stem>/vN/<filename>
        """
        meta = self.get_object()
        media_root = Path(settings.MEDIA_ROOT)

        stem = Path(meta.file_name).stem
        base = media_root / "versions" / stem
        items = []
        if base.exists():
            for p in sorted(base.glob("v*/**/*"), key=lambda x: x.as_posix()):
                if p.is_file():
                    rel = p.relative_to(media_root).as_posix()
                    items.append({
                        "version_path": rel,
                        "version": p.parts[-3] if len(p.parts) >= 3 and p.parts[-3].startswith("v") else None,
                        "url": f"{settings.MEDIA_URL.rstrip('/')}/{rel}",
                    })
        return Response({"versions": items}, status=status.HTTP_200_OK)

    