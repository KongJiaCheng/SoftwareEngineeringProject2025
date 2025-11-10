
from django.db import models
#from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import User  # to reference "Modified By" user
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

class AssetMetadata(models.Model):
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50, blank=True)
    file_size = models.FloatField(null=True, blank=True)   # store in MB
    file_location = models.CharField(max_length=500, null=True, blank=True)  # path relative to MEDIA_ROOT("""supposed to not have null or empty, only set true when developing""")

    description = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)       # example: ["car", "3d", "black"]

    resolution = models.CharField(max_length=20, blank=True, null=True) # for images/videos (1080 x 1920)
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

