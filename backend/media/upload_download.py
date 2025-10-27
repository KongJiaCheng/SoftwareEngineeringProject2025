import os
import sys  # for command line args
import mimetypes # for MIME type detection
from io import BytesIO
from datetime import datetime
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.urls import path, re_path
from django.views.static import serve as media_serve
from django.http import JsonResponse, HttpResponseNotFound
from django.core.files.base import ContentFile

from rest_framework import views, status, serializers
from rest_framework.response import Response

from .models import Asset, AssetVersion
from .serializers import AssetSerializer, AssetVersionSerializer
# from rest_framework import viewsets, status
# from rest_framework.decorators import action
# from rest_framework.response import Response

# from django.http import HttpResponse
# from .models import Asset, AssetVersion
# from .serializers import AssetSerializer, AssetVersionSerializer

# class AssetViewSet(viewsets.ModelViewSet):
#     serializer_class = AssetSerializer
    
#     def get_queryset(self):
#         return Asset.objects.filter(created_by=self.request.user)
    
#     @action(detail=True, methods=['get'])
#     def preview(self, request, pk=None):
#         """Get asset preview information"""
#         asset = self.get_object()
#         serializer = self.get_serializer(asset)
#         return Response(serializer.data)
    
#     @action(detail=True, methods=['get'])
#     def download(self, request, pk=None):
#         """Download asset file"""
#         asset = self.get_object()
#         file_path = asset.file.path
        
#         if os.path.exists(file_path):
#             with open(file_path, 'rb') as fh:
#                 response = HttpResponse(fh.read(), content_type=asset.mime_type)
#                 response['Content-Disposition'] = f'attachment; filename="{asset.original_filename}"'
#                 return response
#         return Response({'error': 'File not found'}, status=404)
    
#     @action(detail=True, methods=['get'])
#     def versions(self, request, pk=None):
#         """Get all versions of an asset"""
#         asset = self.get_object()
#         versions = asset.versions.all()
#         serializer = AssetVersionSerializer(versions, many=True)
#         return Response(serializer.data)
    
#     @action(detail=True, methods=['post'])
#     def create_version(self, request, pk=None):
#         """Create a new version of an asset"""
#         asset = self.get_object()
#         new_file = request.FILES.get('file')
        
#         if not new_file:
#             return Response({'error': 'No file provided'}, status=400)
        
#         # Calculate new version number
#         latest_version = asset.versions.order_by('-version_number').first()
#         new_version_number = latest_version.version_number + 1 if latest_version else 1
        
#         # Create new version
#         new_version = AssetVersion.objects.create(
#             asset=asset,
#             file=new_file,
#             version_number=new_version_number,
#             comment=request.data.get('comment', ''),
#             created_by=request.user,
#             file_size=new_file.size,
#             mime_type=new_file.content_type
#         )
        
#         serializer = AssetVersionSerializer(new_version)
#         return Response(serializer.data, status=status.HTTP_201_CREATED)

# Serializers ----------------
class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = ["id", "file", "uploaded_at", "original_name", "content_type", "size_bytes"]
# Serializers ----------------

# Validation helpers ----------------
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".ogg", ".glb"}
ALLOWED_MIME_PREFIXES = ("image/", "video/")
ALLOWED_MIME_EXACT = {"model/gltf-binary"}  # for .glb

def is_allowed(filename: str, content_type: str) -> bool:
    ext = os.path.splitext(filename.lower())[1]
    if ext in ALLOWED_EXTS:
        return True
    # Fallback to MIME
    if any(content_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):
        return True
    if content_type in ALLOWED_MIME_EXACT:
        return True
    return False
# Validation helpers ----------------

# Views ----------------
class AssetListCreateView(views.APIView):
    """
    GET: List recent assets (most recent first)
    POST: Upload one or multiple files using field name "files"
    """
    def get(self, request):
        qs = Asset.objects.order_by("-uploaded_at")[:100]
        data = [obj.to_dict() for obj in qs]
        return Response(data)

    def post(self, request):
        files = request.FILES.getlist("files")  # get uploaded files
        if not files:   #validates if files exist
            return Response({"detail": "No files uploaded. Use 'files' field."},
                            status=status.HTTP_400_BAD_REQUEST)
        created = []
        for f in files:
            fname = f.name
            ctype = getattr(f, "content_type", "") or mimetypes.guess_type(fname)[0] or ""
            if not is_allowed(fname, ctype):
                return Response({"detail": f"File type not allowed: {fname}"}, status=415)

            storage = FileSystemStorage(location=settings.MEDIA_ROOT)   #sets storage location
            upload_dir = os.path.join("uploads", datetime.now().strftime("%Y/%m/%d"))   #creates upload directory based on date
            saved_path = storage.save(os.path.join(upload_dir, fname), f)  # relative to MEDIA_ROOT

            asset = Asset.objects.create(   #generates asset metadata in database
                file=saved_path, # relative path to file
                original_name=fname,
                content_type=ctype,
                size_bytes=getattr(f, "size", 0),
            )
            created.append(asset.to_dict())
            asset.file.save(os.path.join(upload_dir, fname), f, save=False) # saves the file to the storage
            asset.save()   # saves the asset metadata to the database
        return Response({"uploaded": created}, status=status.HTTP_201_CREATED)
# Views ----------------

# #URLs ----------------
# urlpatterns = [ # URL patterns for the views
#     path("api/assets/", AssetListCreateView.as_view()),
#     re_path(r"^media/(?P<path>.*)$", media_serve),
# ]
# #URLs ----------------

# # Runserver ----------------
# if __name__ == "__main__":
#     # Allow "python server.py runserver 0.0.0.0:8000" etc.
#     if len(sys.argv) == 1:
#         sys.argv += ["runserver", "127.0.0.1:8000"]
#     execute_from_command_line(sys.argv)
# # Runserver ----------------