'''
Modify and create tables for metadata
✅ You should modify this file whenever you:

Add new metadata fields
Change field types
Rename or delete fields

🪄 After any change → always run:

python manage.py makemigrations
python manage.py migrate
'''

from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.db.models import JSONField
from PIL import Image        # to read image metadata
import os

#test
class AssetMetadata(models.Model):
    asset_name = models.CharField(max_length=100)
    file = models.FileField(upload_to='uploads/', null=True, blank=True)

    file = models.FileField(upload_to='uploads/')  # ✅ file upload field
    custom_fields = models.JSONField(default=dict, blank=True)
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    file_type = models.CharField(max_length=20, blank=True)
    file_size = models.FloatField(null=True, blank=True)       # MB
    resolution = models.CharField(max_length=50, blank=True)   # e.g., 1920x1080
    duration = models.FloatField(null=True, blank=True)        # seconds (videos)
    dimensions = models.CharField(max_length=100, blank=True)  # 3D model dimensions

    def __str__(self):
        return self.asset_name