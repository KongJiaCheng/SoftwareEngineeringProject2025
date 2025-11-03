from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssetViewSet
import upload_download.views as viewsUD

router = DefaultRouter()
router.register(r"", AssetViewSet, basename="asset")

urlpatterns = [
    path("", include(router.urls)),
    # path("get/", views.get, name="asset_list"),
    path("upload/", viewsUD.upload, name="asset_upload"),
    path("download/<int:pk>/", viewsUD.download, name="asset_download"),
]

