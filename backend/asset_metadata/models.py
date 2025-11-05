'''
Modify and create tables for metadata
✅ You should modify this file whenever you:

Add new metadata fields
Change field types
Rename or delete fields

🪄 After any change → always run:

python manage.py makemigrations
python manage.py migrate
python manage.py runserver


from django.db import models
from django.contrib.postgres.fields import ArrayField
from PIL import Image
import os
import mimetypes

class AssetMetadata(models.Model):
    asset_name = models.CharField(max_length=100)
    upload_file = models.FileField(upload_to='uploads/', null=True, blank=True)  # ✅ main file field

    file_type = models.CharField(max_length=20, blank=True)
    file_size = models.FloatField(null=True, blank=True)       # MB
    created_at = models.DateTimeField(auto_now_add=True)

    resolution = models.CharField(max_length=50, blank=True)   # 1920x1080
    duration = models.FloatField(null=True, blank=True)        # seconds (videos)
    dimensions = models.CharField(max_length=100, blank=True)  # 3D model dimensions

    custom_fields = models.JSONField(default=dict, blank=True)
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)
'''
from django.db import models
#from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import User  # to reference "Modified By" user
from django.conf import settings

class AssetMetadata(models.Model):
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50, blank=True)
    file_size = models.FloatField(null=True, blank=True)   # store in MB
    file_location = models.CharField(max_length=500, null=True, blank=True)  # path relative to MEDIA_ROOT("""supposed to not have null or empty, only set true when developing""")

    description = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)       # example: ["car", "3d", "black"]

    polygon_count = models.IntegerField(null=True, blank=True) # for 3D model
    duration = models.DurationField(null=True, blank=True)  # for videos
    no_of_versions = models.IntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    modified_by = models.ForeignKey(
        #settings.AUTH_USER_MODEL,
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="modified_assets"
    )

    def __str__(self):
        return self.file_name

#class UserProfile(AbstractUser):   # replace User model
'''
class UserProfile(models.Model):

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("editor", "Editor"),
        ("viewer", "Viewer"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="viewer")

    def __str__(self):
        return f"{self.user.username} ({self.role})"
    '''

