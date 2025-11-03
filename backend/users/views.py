from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Asset, AssetVersion, Tag
from .serializers import AssetSerializer, AssetVersionSerializer, TagSerializer
from .permissions import IsAdminOrEditor
# users/views.py
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt  # only for quick local testing; remove or handle CSRF in production
def simple_login(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    try:
        data = json.loads(request.body.decode())
    except Exception:
        return JsonResponse({"error": "invalid json"}, status=400)

    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return JsonResponse({"error": "username and password required"}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is not None and user.is_active:
        # authenticated
        return JsonResponse({"ok": True, "username": user.username})
    else:
        return JsonResponse({"ok": False, "error": "invalid credentials"}, status=401)
