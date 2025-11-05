
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db import transaction
from django.conf import settings
from pathlib import Path
import os

from .models import Asset, AssetVersion
from .serializers import AssetSerializer, AssetVersionSerializer
from .utils import ensure_basic_info, build_previews

class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer

    def get_queryset(self):
       
        return Asset.objects.filter(created_by=self.request.user)

    #---
    def _init_or_add_version_from_current(self, asset, note=""):
        
        latest = asset.versions.order_by("-version_number").first()
        next_no = (latest.version_number + 1) if latest else 1
        AssetVersion.objects.create(
            asset=asset,
            file=asset.file,                
            version_number=next_no,
            comment=note or ("Initial" if next_no == 1 else "Updated"),
            created_by=self.request.user,
            file_size=asset.file_size,
            mime_type=asset.mime_type
        )

    
    def perform_create(self, serializer):
        with transaction.atomic():
            asset = serializer.save(created_by=self.request.user)
            ensure_basic_info(asset)
            build_previews(asset, Path(settings.MEDIA_ROOT))
            self._init_or_add_version_from_current(asset, note="Initial")

   
    def perform_update(self, serializer):
        with transaction.atomic():
            asset = serializer.save()
            ensure_basic_info(asset)
            build_previews(asset, Path(settings.MEDIA_ROOT))
           
            self._init_or_add_version_from_current(asset, note="Updated")

  
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        asset = self.get_object()
       
        if (not asset.preview_file) or (not asset.thumbnail):
            ensure_basic_info(asset)
            build_previews(asset, Path(settings.MEDIA_ROOT))
        return Response(self.get_serializer(asset).data)

    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        asset = self.get_object()
        if asset.file and os.path.exists(asset.file.path):
            with open(asset.file.path, 'rb') as fh:
                resp = HttpResponse(fh.read(), content_type=asset.mime_type or "application/octet-stream")
                filename = asset.original_filename or os.path.basename(asset.file.name)
                resp['Content-Disposition'] = f'attachment; filename="{filename}"'
                return resp
        return Response({'error': 'File not found'}, status=404)

   
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        asset = self.get_object()
        versions = asset.versions.all().order_by("-version_number")
        return Response(AssetVersionSerializer(versions, many=True).data)

    
    @action(detail=True, methods=['post'])
    def create_version(self, request, pk=None):
        asset = self.get_object()
        new_file = request.FILES.get('file')
        if not new_file:
            return Response({'error': 'file is required'}, status=400)

        with transaction.atomic():
            
            asset.file = new_file
            asset.original_filename = new_file.name
            asset.save(update_fields=["file", "original_filename"])

          
            ensure_basic_info(asset)
            build_previews(asset, Path(settings.MEDIA_ROOT))

           
            latest = asset.versions.order_by("-version_number").first()
            next_no = (latest.version_number + 1) if latest else 1
            new_version = AssetVersion.objects.create(
                asset=asset,
                file=asset.file,
                version_number=next_no,
                comment=request.data.get('comment', ''),
                created_by=request.user,
                file_size=asset.file_size,
                mime_type=asset.mime_type
            )

        return Response(AssetVersionSerializer(new_version).data, status=status.HTTP_201_CREATED)
