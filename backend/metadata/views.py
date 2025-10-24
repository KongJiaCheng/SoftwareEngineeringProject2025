from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from .models import AssetMetadata

def metadata_list(request):
    data = list(AssetMetadata.objects.values())  # get all metadata rows
    return JsonResponse(data, safe=False)