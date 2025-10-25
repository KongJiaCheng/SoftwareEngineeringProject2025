from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from .models import Asset, AssetVersion
from .serializers import AssetSerializer, AssetVersionSerializer
import os

class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer
    
    def get_queryset(self):
        return Asset.objects.filter(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Get asset preview information"""
        asset = self.get_object()
        serializer = self.get_serializer(asset)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download asset file"""
        asset = self.get_object()
        file_path = asset.file.path
        
        if os.path.exists(file_path):
            with open(file_path, 'rb') as fh:
                response = HttpResponse(fh.read(), content_type=asset.mime_type)
                response['Content-Disposition'] = f'attachment; filename="{asset.original_filename}"'
                return response
        return Response({'error': 'File not found'}, status=404)
    
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """Get all versions of an asset"""
        asset = self.get_object()
        versions = asset.versions.all()
        serializer = AssetVersionSerializer(versions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def create_version(self, request, pk=None):
        """Create a new version of an asset"""
        asset = self.get_object()
        new_file = request.FILES.get('file')
        
        if not new_file:
            return Response({'error': 'No file provided'}, status=400)
        
        # Calculate new version number
        latest_version = asset.versions.order_by('-version_number').first()
        new_version_number = latest_version.version_number + 1 if latest_version else 1
        
        # Create new version
        new_version = AssetVersion.objects.create(
            asset=asset,
            file=new_file,
            version_number=new_version_number,
            comment=request.data.get('comment', ''),
            created_by=request.user,
            file_size=new_file.size,
            mime_type=new_file.content_type
        )
        
        serializer = AssetVersionSerializer(new_version)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
