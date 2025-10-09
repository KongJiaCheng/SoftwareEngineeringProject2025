# assets/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid

# Extend user to include role
class User(AbstractUser):
    ROLE_CHOICES = (("admin","Admin"),("editor","Editor"),("viewer","Viewer"))
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="viewer")

class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)

class Asset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="assets")
    tags = models.ManyToManyField(Tag, blank=True, related_name="assets")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    # search vector can be updated by triggers or Django signals
    # additional metadata as JSON
    metadata = models.JSONField(default=dict, blank=True)

class AssetVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="versions")
    file_path = models.CharField(max_length=1024)   # S3 key or local path
    filename = models.CharField(max_length=512)
    content_type = models.CharField(max_length=200)
    size = models.BigIntegerField()
    created_at = models.DateTimeField(default=timezone.now)
    version_number = models.PositiveIntegerField()
    checksum = models.CharField(max_length=128, blank=True)
    # derived preview fields (thumbnail url etc) will be populated asynchronously
    preview = models.CharField(max_length=1024, blank=True, null=True)
    processed = models.BooleanField(default=False)
