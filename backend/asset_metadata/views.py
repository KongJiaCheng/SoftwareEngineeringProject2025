from django.shortcuts import render
from django.http import JsonResponse
from .models import AssetMetadata
from asset_metadata import views

def metadata_list(request):
    data = list(AssetMetadata.objects.values())  # get all metadata rows
    return JsonResponse(data, safe=False)

from rest_framework import viewsets, permissions
from .models import AssetMetadata
from .serializers import AssetMetadataSerializer

class AssetMetadataViewSet(viewsets.ModelViewSet):
    queryset = AssetMetadata.objects.all().order_by("-created_at")
    serializer_class = AssetMetadataSerializer
    permission_classes = [permissions.AllowAny]  # or IsAuthenticated if you have auth

    def perform_create(self, serializer):
        # If you want to track who modified it (optional, requires auth)
        user = getattr(self.request, "user", None)
        serializer.save(modified_by=user if user and user.is_authenticated else None)

    def perform_update(self, serializer):
        user = getattr(self.request, "user", None)
        serializer.save(modified_by=user if user and user.is_authenticated else None)



def get_asset(request, pk):
    asset = get_object_or_404(AssetMetadata, id=pk)
    return JsonResponse({
        "id": asset.id,
        "asset_name": asset.asset_name,
        "file_type": asset.file_type,
        "file_location": asset.upload_file.url if asset.upload_file else "",
        "description": asset.description,
        "tags": asset.tags,
    })
'''
 # Delete the record from database when user click delete button from the website
    #def delete_asset(request, asset_id):
    #    asset = AssetMetadata.objects.get(id=asset_id)
    #    asset.delete()  # this triggers delete() in the model
    #    return redirect('asset_list')  # go back to the list page after deletion
'''
   