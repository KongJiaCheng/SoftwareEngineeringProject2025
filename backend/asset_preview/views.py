# backend/asset_preview/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse, Http404
from django.utils import timezone
from django.conf import settings
from pathlib import Path
import os
import mimetypes

from asset_metadata.models import AssetMetadata
from .serializers import AssetMetadataLiteSerializer
from .utils import ensure_basic_info, build_previews, classify, guess_mime

class AssetPreviewViewSet(viewsets.ModelViewSet):
    """
    API for listing/retrieving AssetMetadata, and performing preview/download/version actions.
    """
    queryset = AssetMetadata.objects.all().order_by("-modified_at", "-created_at")
    serializer_class = AssetMetadataLiteSerializer
    permission_classes = [IsAuthenticated]

    # GET /api/preview/assets/{pk}/preview/
    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        meta = self.get_object()
        media_root = Path(settings.MEDIA_ROOT)
        ensure_basic_info(meta, media_root)
        previews = build_previews(meta, media_root)  # return dict of preview URLs (thumb, poster, etc.)
        return Response({"previews": previews}, status=status.HTTP_200_OK)

    # GET /api/preview/assets/{pk}/download/
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

    # GET /api/preview/assets/{pk}/versions/
    @action(detail=True, methods=["get"])
    def versions(self, request, pk=None):
        """
        Walk your versions directory convention and list existing versions with URLs.
        """
        meta = self.get_object()
        media_root = Path(settings.MEDIA_ROOT)

        # Example convention: media_root / "versions" / <stem> / vN / <filename>
        stem = Path(meta.file_name).stem
        base = media_root / "versions" / stem
        items = []
        if base.exists():
            for p in sorted(base.glob("v*/**/*"), key=lambda x: x.as_posix()):
                if p.is_file():
                    rel = p.relative_to(media_root).as_posix()
                    items.append({
                        "version_path": rel,
                        "version": p.parts[-3] if "v" in p.parts[-3] else None,  # crude parse like "v3"
                        "url": f"{settings.MEDIA_URL.rstrip('/')}/{rel}",
                    })
        return Response({"versions": items}, status=status.HTTP_200_OK)

    # POST /api/preview/assets/{pk}/create_version/
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
