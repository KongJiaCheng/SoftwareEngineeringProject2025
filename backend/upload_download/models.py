# backend/upload_download/models.py
from django.db import models
from asset_metadata.models import AssetMetadata as _Base

class UploadAsset(_Base):
    """
    Proxy model so upload_download shows up in Django Admin.
    Uses the same DB table as AssetMetadata, no migration needed.
    """
    class Meta:
        proxy = True
        app_label = "upload_download"
        verbose_name = "Upload/Download Asset"
        verbose_name_plural = "Upload/Download Assets"
