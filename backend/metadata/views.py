<<<<<<< HEAD
from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from .models import AssetMetadata

def metadata_list(request):
    data = list(AssetMetadata.objects.values())  # get all metadata rows
=======
from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from .models import AssetMetadata

def metadata_list(request):
    data = list(AssetMetadata.objects.values())  # get all metadata rows
>>>>>>> 49396cfbf75129b3ab146ef0a9b5d71c8b80bcad
    return JsonResponse(data, safe=False)