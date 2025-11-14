# upload_download/views.py
import os, mimetypes
import trimesh
from datetime import datetime, timedelta
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.http import FileResponse, Http404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from PIL import Image

from asset_metadata.models import AssetMetadata
from .serializers import AssetSerializer


def glb_polygon_count(full_path: str):
    try:
        m = trimesh.load(full_path, force="mesh")
        if hasattr(m, "faces"):
            return int(len(m.faces))
        # GLB with multiple meshes
        if hasattr(m, "geometry"):
            total = 0
            for g in m.geometry.values():
                if hasattr(g, "faces"):
                    total += len(g.faces)
            return int(total)
    except Exception as e:
        print("GLB polygon count error:", e)
    return None


# 🔹 NEW: use bounding box to create a “3D resolution” string for GLB
def glb_bbox_resolution(full_path: str):
    try:
        m = trimesh.load(full_path, force="mesh")
        if hasattr(m, "bounding_box"):
            ext = m.bounding_box.extents  # [x, y, z]
            # format like: "148.0x5.6x140.5"
            return f"{ext[0]:.1f}x{ext[1]:.1f}x{ext[2]:.1f}"
    except Exception as e:
        print("GLB bbox resolution error:", e)
    return ""


def asset_resolution(full_path: str):
    try:
        with Image.open(full_path) as im:
            return f"{int(im.width)}x{int(im.height)}"
    except Exception:
        return ""


def _to_timedelta(value):
    if value is None or value == "":  # blank
        return None
    if isinstance(value, (int, float)):  # numeric
        return timedelta(seconds=float(value))
    if isinstance(value, str):  # string
        s = value.strip()
        # numeric string?
        try:
            return timedelta(seconds=float(s))
        except ValueError:
            pass
        # HH:MM:SS or MM:SS
        parts = s.split(":")
        try:
            parts = [float(p) for p in parts]
        except ValueError:
            return None
        if len(parts) == 3:
            h, m, sec = parts   # HH, MM, SS
        elif len(parts) == 2:
            h, m, sec = 0, parts[0], parts[1]
        else:
            return None
        return timedelta(hours=h, minutes=m, seconds=sec)   # return timedelta
    return None


def _payload(a: AssetMetadata):
    # Only fields that exist in the model
    return {
        "id": a.id,
        "file_name": a.file_name,
        "file_type": a.file_type or "",
        "file_size": a.file_size,
        "file_location": a.file_location or "",
        "description": a.description or "",
        "tags": a.tags or [],
        "resolution": a.resolution or "",
        "polygon_count": a.polygon_count,
        # DurationField -> "HH:MM:SS" string for UI
        "duration": (str(a.duration) if a.duration is not None else None),
        "no_of_versions": a.no_of_versions,
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "modified_at": a.modified_at.isoformat() if a.modified_at else None,
    }


@api_view(["POST"])  # upload
@authentication_classes([])      # dev-open
@permission_classes([AllowAny])  # dev-open
def upload(request):
    upfile = request.FILES.get("file")
    if not upfile:
        return Response({"detail": "No file. Send single file in field 'file'."}, status=400)

    # side fields
    file_name = request.POST.get("file_name") or upfile.name
    description = (request.POST.get("description") or "").strip()
    tags_raw = request.POST.get("tags", "")
    duration_raw = request.POST.get("duration", "")
    polygon_count_raw = request.POST.get("polygon_count", None)
    resolution_in = request.POST.get("resolution", "")

    # tags normalize
    tags = []
    if tags_raw:
        try:
            import json
            tags = json.loads(tags_raw)
        except Exception:
            tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

    # polygon_count normalize (client value, will be overridden for GLB)
    if polygon_count_raw is None or str(polygon_count_raw).strip() == "":
        polygon_count = None
    else:
        try:
            polygon_count = int(str(polygon_count_raw).strip())
        except ValueError:
            polygon_count = None

    # mime + size
    ctype = getattr(upfile, "content_type", None) or mimetypes.guess_type(file_name)[0] or "application/octet-stream"
    size_mb = round((getattr(upfile, "size", 0) or 0) / (1024 * 1024), 4)

    # decide subdir once (by type)
    if ctype.startswith("image/"):
        base_subdir = "image"
    elif ctype.startswith("video/"):
        base_subdir = "video"
    elif "gltf" in ctype or "glb" in ctype or file_name.lower().endswith((".glb", ".gltf")):
        base_subdir = "model"
    else:
        base_subdir = "other"

    # HARD CHECK: only images, videos, or .glb
    lower_name = file_name.lower()
    is_image = ctype.startswith("image/")
    is_video = ctype.startswith("video/")
    is_glb = lower_name.endswith(".glb")

    if not (is_image or is_video or is_glb):
        return Response(
            {"detail": "Unsupported file type. Only images, videos, .glb are allowed."},
            status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        )

    # === VERSIONING LOGIC ===
    existing_qs = AssetMetadata.objects.filter(file_name=file_name)
    existing_valid = []
    for a in existing_qs:
        rel = (a.file_location or "").strip()
        if not rel:
            continue
        full = os.path.join(settings.MEDIA_ROOT, rel.replace("/", os.sep))
        if os.path.exists(full):
            existing_valid.append(a)

    existing_count = len(existing_valid)          # how many real files already exist
    new_version_index = existing_count + 1        # this upload will be version N
    total_versions = new_version_index            # total number of versions for this name

    # store file as: <type>/<version>/filename
    versioned_subdir = os.path.join(base_subdir, str(new_version_index))
    target_dir = os.path.join(settings.MEDIA_ROOT, versioned_subdir)
    os.makedirs(target_dir, exist_ok=True)

    storage = FileSystemStorage(location=target_dir)
    saved_name = storage.save(file_name, upfile)
    saved_rel_path = os.path.join(versioned_subdir, saved_name).replace("\\", "/")
    full_path = os.path.join(settings.MEDIA_ROOT, saved_rel_path.replace("/", os.sep))

    # 🔹 auto polygon count for .glb
    if is_glb:
        auto_poly = glb_polygon_count(full_path)
        if auto_poly is not None:
            polygon_count = auto_poly

    # 🔹 resolution:
    #  - image  -> width x height
    #  - glb    -> bboxX x bboxY x bboxZ
    #  - video  -> (optional)
    resolution = (resolution_in.strip() if resolution_in else "")
    if not resolution and is_image:
        resolution = asset_resolution(full_path) or None
    elif not resolution and is_glb:
        res3d = glb_bbox_resolution(full_path)
        resolution = res3d or None
    elif not resolution:
        resolution = None

    # duration
    duration_td = _to_timedelta(duration_raw) if duration_raw else None

    # create record for this version
    a = AssetMetadata.objects.create(
        file_name=file_name,
        file_type=ctype,
        file_size=size_mb,
        file_location=saved_rel_path,   # e.g., "image/1/mylogo.png"
        description=description,
        tags=tags,
        resolution=resolution,
        polygon_count=polygon_count,
        duration=duration_td,
        no_of_versions=total_versions,
    )

    # Update all rows for this file_name so they all show the same no_of_versions
    AssetMetadata.objects.filter(file_name=file_name).update(no_of_versions=total_versions)

    return Response(_payload(a), status=201)





@api_view(["PATCH"])
@authentication_classes([]) # dev-open
@permission_classes([AllowAny]) # dev-open
def update_asset(request, pk: int): # partial update of metadata
    try:
        asset = AssetMetadata.objects.get(pk=pk)    # get existing
    except AssetMetadata.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)

    data = JSONParser().parse(request)

    # Normalize tags (array or comma string)
    if "tags" in data and isinstance(data["tags"], str):
        import json
        try:
            data["tags"] = json.loads(data["tags"])
        except Exception:
            data["tags"] = [t.strip() for t in data["tags"].split(",") if t.strip()]

    # Coerce blanks -> valid values
    for k in ("description", "resolution"):
        if k in data and data[k] == "":
            # description must not be NULL in DB, keep empty string
            data[k] = "" if k == "description" else None

    # Coerce duration (DurationField)
    if "duration" in data:
        data["duration"] = _to_timedelta(data["duration"])

    # Coerce polygon_count to int or None
    if "polygon_count" in data:
        val = data["polygon_count"]
        if val is None or str(val).strip() == "":
            data["polygon_count"] = None
        else:
            try:
                data["polygon_count"] = int(str(val).strip())
            except ValueError:
                data["polygon_count"] = None  # or raise ValidationError

    # Allow the fields you actually want editable
    allowed_keys = {"file_name", "description", "tags"}
    clean = {k: v for k, v in data.items() if k in allowed_keys}

    ser = AssetSerializer(asset, data=clean, partial=True)
    if not ser.is_valid():
        return Response(ser.errors, status=400)
    ser.save()

    asset.refresh_from_db()
    return Response(_payload(asset), status=200)



@api_view(["GET"])
@authentication_classes([]) # dev-open
@permission_classes([AllowAny]) # dev-open
def download(request, pk: int):
    from django.shortcuts import get_object_or_404

    # 1) Find the asset in the database
    asset = get_object_or_404(AssetMetadata, pk=pk)

    # 2) Get the stored relative path (e.g. "image/mylogo.png")
    rel_path = (asset.file_location or "").strip()
    if not rel_path:
        return Response(
            {"detail": "This asset has no file location set."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 3) Normalise and block weird traversal
    #    Turn backslashes into forward slashes, remove leading slash
    rel_path = rel_path.replace("\\", "/").lstrip("/")

    # Very simple safety check against "../" segments
    parts = rel_path.split("/")
    if ".." in parts:
        return Response(
            {"detail": "Invalid file path."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 4) Build full absolute path: MEDIA_ROOT + relative path
    full_path = os.path.join(settings.MEDIA_ROOT, rel_path)
    if not os.path.exists(full_path):
        # File missing on disk → 404
        raise Http404("File not found on server")

    # 5) Guess a content-type for nicer downloads
    ctype, _ = mimetypes.guess_type(full_path)
    if not ctype:
        ctype = "application/octet-stream"

    # 6) Open and stream file as attachment (download)
    file_name = asset.file_name or os.path.basename(full_path)
    f = open(full_path, "rb")
    response = FileResponse(
        f,
        as_attachment=True,
        filename=file_name,
        content_type=ctype,
    )
    return response
