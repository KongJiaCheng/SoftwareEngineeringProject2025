from rest_framework.routers import DefaultRouter
from .views import AssetMetadataViewSet

router = DefaultRouter()
router.register(r"metadata", AssetMetadataViewSet, basename="metadata")

urlpatterns = router.urls