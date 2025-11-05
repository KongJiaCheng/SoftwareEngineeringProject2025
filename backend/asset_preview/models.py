from django.db import models
from asset_metadata.models import AssetMetadata as _Base

class PreviewAsset(_Base):
    class Meta:
        proxy = True
        app_label = "asset_preview"
        verbose_name = "Preview Asset"
        verbose_name_plural = "Preview Assets"
