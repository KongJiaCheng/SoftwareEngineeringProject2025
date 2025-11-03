from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/assets/", include("assets.urls")),
    path('api/', include('users.urls')),   # adjust path/app name as needed
    path("metadata/", include("metadata.urls")),   # handles metadata
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
