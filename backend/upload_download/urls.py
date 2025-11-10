from django.urls import path
from . import views

urlpatterns = [
    path("upload/", views.upload, name="asset_upload"),                 # POST
    path("upload/<int:pk>/", views.update_asset, name="asset_update"),  # PATCH
    path("download/<int:pk>/", views.download, name="asset_download"),  # GET (optional)
]
