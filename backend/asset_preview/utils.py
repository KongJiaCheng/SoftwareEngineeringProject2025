# backend/asset_preview/utils.py
from __future__ import annotations
from pathlib import Path
from typing import Optional, Dict, Any
from django.conf import settings
import mimetypes
import os
import re

# Optional imaging support (thumbnails for images if available)
try:
    from PIL import Image  # type: ignore
    _HAS_PIL = True
except Exception:
    _HAS_PIL = False

# -----------------------------
# Helpers
# -----------------------------
def _media_root() -> Path:
    return Path(settings.MEDIA_ROOT)

def _ensure_dir(p: Path) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)

def _stem_safe(name: str) -> str:
    stem = Path(name).stem
    return re.sub(r'[^A-Za-z0-9._-]+', '_', stem) or "asset"

# -----------------------------
# Public API used by views.py
# -----------------------------
def guess_mime(path_or_str: str) -> str:
    """
    Best-effort MIME guess based on filename.
    """
    mime, _ = mimetypes.guess_type(str(path_or_str))
    return mime or "application/octet-stream"

def classify(path: Path) -> str:
    """
    Classify the file into 'image' | 'video' | 'pdf' | 'other'.
    """
    mime = guess_mime(str(path))
    if mime.startswith("image/"):
        return "image"
    if mime.startswith("video/"):
        return "video"
    if mime == "application/pdf":
        return "pdf"
    return "other"

def ensure_basic_info(meta, media_root: Optional[Path] = None) -> None:
    """
    Ensure fields like file_size (MB) and file_type are filled on AssetMetadata.
    Does nothing if file is missing.
    """
    media_root = media_root or _media_root()
    if not getattr(meta, "file_location", None):
        return

    abs_path = (media_root / meta.file_location) if not Path(meta.file_location).is_absolute() else Path(meta.file_location)
    if not abs_path.exists():
        return

    # file_size in MB (float)
    try:
        size_mb = round(abs_path.stat().st_size / (1024 * 1024), 4)
    except OSError:
        size_mb = None

    kind = classify(abs_path)

    dirty_fields = []
    if hasattr(meta, "file_size") and (meta.file_size != size_mb):
        meta.file_size = size_mb
        dirty_fields.append("file_size")
    if hasattr(meta, "file_type") and (meta.file_type != kind):
        meta.file_type = kind
        dirty_fields.append("file_type")

    if dirty_fields:
        meta.save(update_fields=dirty_fields)

def build_previews(meta, media_root: Optional[Path] = None) -> Dict[str, Any]:
    """
    Build or locate preview artifacts for the asset.
    Returns dict with:
      - kind: str
      - thumbnail_path: Path | None
      - preview_path: Path | None
    Paths returned are ABSOLUTE Path objects under MEDIA_ROOT.
    """
    media_root = media_root or _media_root()
    result = {"kind": None, "thumbnail_path": None, "preview_path": None}

    if not getattr(meta, "file_location", None):
        return result

    src_abs = (media_root / meta.file_location) if not Path(meta.file_location).is_absolute() else Path(meta.file_location)
    if not src_abs.exists():
        return result

    kind = classify(src_abs)
    result["kind"] = kind

    # Previews directory: MEDIA_ROOT/previews/<stem>/
    stem = _stem_safe(getattr(meta, "file_name", None) or src_abs.name)
    out_dir = media_root / "previews" / stem
    thumb_path = out_dir / "thumb.jpg"
    preview_path = out_dir / "preview.jpg"

    if kind == "image":
        # Create thumb/preview if PIL is available; otherwise just point to original.
        if _HAS_PIL:
            try:
                _ensure_dir(thumb_path)
                with Image.open(src_abs) as im:
                    # Thumbnail
                    im_thumb = im.copy()
                    im_thumb.thumbnail((384, 384))
                    im_thumb.save(thumb_path, format="JPEG", quality=85)

                    # Larger preview
                    im_prev = im.copy()
                    im_prev.thumbnail((1280, 1280))
                    im_prev.save(preview_path, format="JPEG", quality=85)

                result["thumbnail_path"] = thumb_path
                result["preview_path"] = preview_path
                return result
            except Exception:
                # Fallback to using original if processing fails
                pass

        # Fallback: no PIL -> use original as "preview"
        result["thumbnail_path"] = src_abs
        result["preview_path"] = src_abs
        return result

    elif kind == "pdf":
        # Without external tools we cannot rasterize a page here.
        # Return original file as "preview" so the client can at least link/open it.
        result["thumbnail_path"] = None
        result["preview_path"] = src_abs
        return result

    elif kind == "video":
        # If you later add ffmpeg/ffprobe, generate a poster JPEG here.
        # For now, return original as preview link.
        result["thumbnail_path"] = None
        result["preview_path"] = src_abs
        return result

    # other: no previews; return original as preview to have *something* to click
    result["thumbnail_path"] = None
    result["preview_path"] = src_abs
    return result