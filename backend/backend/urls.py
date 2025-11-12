from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
import upload_download.views as viewsUploadDownload
from asset_metadata import views

# import asset_preview.views as viewsAssets

urlpatterns = [
    path("admin/", admin.site.urls),
    path("asset_metadata/", include("asset_metadata.urls")),   # handles metadata

    path("api/", include("asset_metadata.api")),        # DRF router for metadata:
    
    # endpoints (function-based API):
    path("api/upload/", viewsUploadDownload.upload, name="asset_upload"),   
    path("api/download/<int:pk>/", viewsUploadDownload.download, name="asset_download"),
    path("api/preview/", include("asset_preview.urls")),
    path('api/<int:pk>/', views.get_asset, name='get_asset'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


from django.http import JsonResponse

def fake_asset(request, pk):
    return JsonResponse({
        
        "id": 1,
        "asset_name": "Test Asset",
        "file_type": "video/mp4",
        "file_size": "12 MB",
        "file_location": "/media/upload_download/test.mp4",
        "description": "Sample description",
        "tags": "sample, testing",
        "duration": "00:01:23",
        "polygon_count": null

    })

urlpatterns += [
    path("api-test/<int:pk>/", fake_asset),
]
