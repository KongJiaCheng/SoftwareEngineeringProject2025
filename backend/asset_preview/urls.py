# backend/asset_preview/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssetPreviewViewSet

router = DefaultRouter()
router.register(r'assets', AssetPreviewViewSet, basename='asset-preview')

urlpatterns = [
    path('', include(router.urls)),
]