from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
import upload_download.views as viewsUploadDownload
# import asset_preview.views as viewsAssets

urlpatterns = [
    path("admin/", admin.site.urls),
    path("asset_metadata/", include("asset_metadata.urls")),   # handles metadata

    path("api/", include("asset_metadata.api")),        # DRF router for metadata:
    
    # endpoints (function-based API):
    path("api/upload/", viewsUploadDownload.upload, name="asset_upload"),   
    path("api/download/<int:pk>/", viewsUploadDownload.download, name="asset_download"),
    # path("api/preview/", include("asset_preview.urls")),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
