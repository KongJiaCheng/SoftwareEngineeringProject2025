# assets/urls.py
from rest_framework.routers import DefaultRouter
from .views import AssetViewSet, TagViewSet

router = DefaultRouter()
router.register(r"assets", AssetViewSet, basename="asset")
router.register(r"tags", TagViewSet)
