from django.db import models
from django.contrib.auth.models import User
import os
import uuid

def asset_file_path(instance, filename):
    """Generate file path for new asset"""
    ext = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{ext}'
    return os.path.join('assets/', filename)

class Asset(models.Model):
    ASSET_TYPES = (
        ('image', 'Image'),
        ('video', 'Video'),
        ('document', 'Document'),
        ('other', 'Other'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=asset_file_path)
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=ASSET_TYPES)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    
    # Metadata
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    tags = models.ManyToManyField('Tag', blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Preview info
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)
    preview_file = models.FileField(upload_to='previews/', null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']

class AssetVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.ForeignKey(Asset, related_name='versions', on_delete=models.CASCADE)
    file = models.FileField(upload_to=asset_file_path)
    version_number = models.PositiveIntegerField()
    comment = models.TextField(blank=True)
    
    # Who created this version and when
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # File info for this specific version
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    
    class Meta:
        ordering = ['-version_number']
        unique_together = ['asset', 'version_number']

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default='#718096')  # Hex color
    
    def __str__(self):
        return self.name
