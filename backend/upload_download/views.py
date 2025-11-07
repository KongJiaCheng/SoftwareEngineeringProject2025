import os
import mimetypes
from datetime import datetime
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.http import FileResponse, Http404
from rest_framework import views, status
from rest_framework.response import Response
from asset_metadata.models import AssetMetadata
from .serializers import AssetSerializer
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from django.db import IntegrityError, transaction
from PIL import Image



  
# Uploader # 
@api_view(["POST"])
def upload(request):    # handles file uploads
    files = request.FILES.getlist("files")
    if not files:
        return Response(
            {"detail": "No files uploaded. Use 'files' field."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    created = []
    storage = FileSystemStorage(location=settings.MEDIA_ROOT)
    upload_dir = os.path.join("uploads", datetime.now().strftime("%Y/%m/%d"))

    for f in files:
        filename = f.name  # original filename
        contentType = getattr(f, "content_type", "") or mimetypes.guess_type(filename)[0] or ""  # detect content type
        if not is_allowed(filename, contentType):
            return Response({"detail": f"File type not allowed: {filename}"}, status=415)

        # Save file path
        savedPath = storage.save(os.path.join(upload_dir, filename), f)
        fullPath = os.path.join(settings.MEDIA_ROOT, savedPath)

        #Get Db Fields
        metadata = {
            "asset_name": filename,
            "file": savedPath,
            "file_type": contentType,
            "file_size": round(f.size / (1024 * 1024), 2),  # MB
            "resolution": "",
            "duration": None,
            "dimensions": "",
            "custom_fields": {},
            "tags": [],
        }

        
        if contentType.startswith("image/"):  # If it's an image
            try:
                img = Image.open(fullPath)
                metadata["resolution"] = f"{img.width}x{img.height}"
            except Exception:
                pass

        
        # elif contentType.startswith("video/"):    # If it's a video
        #     try:
        #         clip = VideoFileClip(full_path)
        #         metadata["duration"] = round(clip.duration, 2)
        #         clip.close()
        #     except Exception:
        #         pass

        
        elif contentType == "model/gltf-binary":  # If it's a 3D model (.glb)
            # You could later parse dimensions from metadata['custom_fields']
            metadata["dimensions"] = "Unknown (GLB model)"

        # Save to DB (model only stores what we detected)
        asset = AssetMetadata.objects.create(**metadata)
        created.append(AssetSerializer(asset).data)

    return Response({"uploaded": created}, status=status.HTTP_201_CREATED)
# Uploader # 

# Downloader #
@api_view(["GET"]) 
def download(self, request, pk):
    asset = self.get_asset(pk) # retrieve asset by primary key
    file_path = self.get_file_path(asset)   # get full file path
    if not os.path.exists(file_path):
        raise Http404("File not found on disk")
    response = FileResponse(open(file_path, "rb"), as_attachment=True, filename=asset.original_name)    # create file response for download
    return response
# Downloader #

# Validation helpers # 
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".ogg", ".glb"}
ALLOWED_MIME_PREFIXES = ("image/", "video/")    # for images and videos
ALLOWED_MIME_EXACT = {"model/gltf-binary"}  # for .glb models

def is_allowed(filename: str, content_type: str) -> bool:
    extention = os.path.splitext(filename.lower())[1] # get file extension
    if extention in ALLOWED_EXTS: # check extension
        return True
    # Fallback to MIME
    if any(content_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):      # check MIME type prefix
        return True
    if content_type in ALLOWED_MIME_EXACT:
        return True
    return False
# Validation helpers # 