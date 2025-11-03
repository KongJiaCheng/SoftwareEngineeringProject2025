import os
import sys  # for command line args
import mimetypes # for MIME type detection(Multipurpose Internet Mail Extensions): standard identifier that indicates the format of a file or document to a computer system
from io import BytesIO
from datetime import datetime
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.urls import path, re_path
from django.views.static import serve as media_serve
from django.http import JsonResponse, HttpResponseNotFound
from django.core.files.base import ContentFile
from django.http import FileResponse, Http404
from .models import Asset, AssetVersion
from .serializers import AssetSerializer, AssetVersionSerializer
from rest_framework import views, status, serializers
from rest_framework.response import Response
from rest_framework import viewsets, status


# Serializers # 
class AssetSerializer(serializers.ModelSerializer): # Serializer for Asset model
    class Meta:
        model = Asset
        fields = ["id", "file", "uploaded_at", "original_name", "content_type", "size_bytes"]
# Serializers # 

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

# Upload_download # 
class AssetUpload_download(views.APIView):   
    def get(self, request):  # lists recent assets
        querySet = Asset.objects.order_by("-uploaded_at")[:100]  #     
        data = [x.to_dict() for x in querySet]    #serialize assets to list of dicts
        return Response(data)
    
    # Uploader # 
    def post(self, request):    # handles file uploads
        files = request.FILES.getlist("files")  # get uploaded files
        if not files:   #validates if files exist
            return Response({"detail": "No files uploaded. Use 'files' field."},status=status.HTTP_400_BAD_REQUEST)
        created = []
        for f in files:  #process each uploaded file
            fname = f.name  # original filename
            ctype = getattr(f, "content_type", "") or mimetypes.guess_type(fname)[0] or ""  # determine content type
            if not is_allowed(fname, ctype):    #validate file type
                return Response({"detail": f"File type not allowed: {fname}"}, status=415)

            storage = FileSystemStorage(location=settings.MEDIA_ROOT)   #sets storage location
            upload_dir = os.path.join("uploads", datetime.now().strftime("%Y/%m/%d"))   #creates upload directory based on date
            saved_path = storage.save(os.path.join(upload_dir, fname), f)  # relative to MEDIA_ROOT

            asset = Asset.objects.create(   #generates asset metadata in database
                file=saved_path, # relative path to file
                original_name=fname,    # original filename
                content_type=ctype,     # MIME type
                size_bytes=getattr(f, "size", 0),
            )
            created.append(asset.to_dict())
            asset.file.save(os.path.join(upload_dir, fname), f, save=False) # saves the file to the storage
            asset.save()   # saves the asset metadata to the database
        return Response({"uploaded": created}, status=status.HTTP_201_CREATED)
    # Uploader # 

    # downloade #r
    def download(self, request, pk):
        asset = self.get_asset(pk) # retrieve asset by primary key
        file_path = self.get_file_path(asset)   # get full file path
        if not os.path.exists(file_path):
            raise Http404("File not found on disk")
        response = FileResponse(open(file_path, "rb"), as_attachment=True, filename=asset.original_name)    # create file response for download
        return response
    # downloade #r
# Upload_download # 

# # Media serve view from MEDIA_ROOT # 
# def media_serve(request, path):
#     fullpath = os.path.join(settings.MEDIA_ROOT, path)
#     if not os.path.exists(fullpath):
#         return HttpResponseNotFound("Not Found")
#     with open(fullpath, "rb") as fh:
#         data = fh.read()
#     ctype = mimetypes.guess_type(fullpath)[0] or "application/octet-stream"
#     resp = JsonResponse({"error": "Unsupported method"}, status=405)
#     if request.method == "GET":
#         from django.http import HttpResponse
#         r = HttpResponse(data, content_type=ctype)
#         return r
#     return resp
# # Media serve view from MEDIA_ROOT # 

# #URLs # 
# urlpatterns = [ # URL patterns for the views
#     path("api/assets/", AssetListCreateView.as_view()),
#     re_path(r"^media/(?P<path>.*)$", media_serve),
# ]
# #URLs # 

# # Runserver # 
# if __name__ == "__main__":
#     # Allow "python server.py runserver 0.0.0.0:8000" etc.
#     if len(sys.argv) == 1:
#         sys.argv += ["runserver", "127.0.0.1:8000"]
#     execute_from_command_line(sys.argv)
# # Runserver # 