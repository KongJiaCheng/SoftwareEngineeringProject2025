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
    # Ensure basic info is up-to-date on list (file_size/file_type), then serialize
    def list(self, request, *args, **kwargs):
        media_root = Path(settings.MEDIA_ROOT)
        for meta in self.get_queryset():
            ensure_basic_info(meta, media_root)
        return super().list(request, *args, **kwargs)

    # GET /api/asset_preview/assets/{pk}/preview/
    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        meta = self.get_object()
        media_root = Path(settings.MEDIA_ROOT)
        ensure_basic_info(meta, media_root)
        previews = build_previews(meta, media_root)  # returns dict with absolute Paths

        thumb_url = _to_media_url(previews.get("thumbnail_path"))
        prev_url  = _to_media_url(previews.get("preview_path"))

        return Response(
            {"previews": {
                "kind": previews.get("kind"),
                "thumbnail_url": thumb_url,
                "preview_url": prev_url,
            }},
            status=status.HTTP_200_OK
        )

    # GET /api/asset_preview/assets/{pk}/download/
    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        meta = self.get_object()
        media_root = Path(settings.MEDIA_ROOT)
        abs_path = (media_root / meta.file_location).resolve()
        if not abs_path.exists():
            raise Http404("File not found")
        mime, _ = mimetypes.guess_type(abs_path.as_posix())
        resp = FileResponse(open(abs_path, "rb"), as_attachment=True, filename=meta.file_name)
        if mime:
            resp["Content-Type"] = mime
        return resp

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

    # POST /api/asset_preview/assets/{pk}/create_version/
    @action(detail=True, methods=["post"])
    def create_version(self, request, pk=None):
        """
        Accept a file upload (multipart) and store as next version; update metadata pointer.
        """
        meta = self.get_object()
        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "Missing file"}, status=status.HTTP_400_BAD_REQUEST)

        media_root = Path(settings.MEDIA_ROOT)
        stem = Path(meta.file_name).stem
        current = meta.no_of_versions or 0
        next_v = current + 1
        target_dir = media_root / "versions" / stem / f"v{next_v}"
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / upload.name

        with open(target_path, "wb") as f:
            for chunk in upload.chunks():
                f.write(chunk)

        # Update the live pointer to newest version
        rel_location = target_path.relative_to(media_root).as_posix()
        meta.file_location = rel_location
        meta.file_name = upload.name
        meta.no_of_versions = next_v
        meta.modified_by = request.user if request.user.is_authenticated else None
        meta.modified_at = timezone.now()
        meta.save(update_fields=["file_location", "file_name", "no_of_versions", "modified_by", "modified_at"])

        # Backfill info + previews
        ensure_basic_info(meta, media_root)
        build_previews(meta, media_root)

        return Response({
            "message": "Version created",
            "version": next_v,
            "file_url": f"{settings.MEDIA_URL.rstrip('/')}/{rel_location}"
        }, status=status.HTTP_201_CREATED)
