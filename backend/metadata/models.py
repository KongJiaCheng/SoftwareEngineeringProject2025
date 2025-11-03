<<<<<<< HEAD
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

    #file = models.FileField(upload_to='uploads/')  # ✅ file upload field
    custom_fields = models.JSONField(default=dict, blank=True)
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    file_type = models.CharField(max_length=20, blank=True)
    file_size = models.FloatField(null=True, blank=True)       # MB
    resolution = models.CharField(max_length=50, blank=True)   # e.g., 1920x1080
    duration = models.FloatField(null=True, blank=True)        # seconds (videos)
    dimensions = models.CharField(max_length=100, blank=True)  # 3D model dimensions

    def save(self, *args, **kwargs):
        """Automatically detect and store metadata when saving a file"""
        if self.file:
            file_path = self.file.path
            self.asset_name = os.path.basename(self.file.name)

            # File size (in MB)
            self.file_size = round(self.file.size / (1024 * 1024), 2)

            # Detect file type by extension
            ext = os.path.splitext(self.file.name)[1].lower()
            if ext in ['.jpg', '.jpeg', '.png']:
                self.file_type = 'image'
                try:
                    with Image.open(self.file) as img:
                        self.resolution = f"{img.width}x{img.height}"
                except Exception:
                    self.resolution = "Unknown"
            elif ext in ['.mp4', '.mov', '.avi']:
                self.file_type = 'video'
                # Optional: can use moviepy for duration if installed
                try:
                    from moviepy.editor import VideoFileClip
                    clip = VideoFileClip(file_path)
                    self.duration = round(clip.duration, 2)
                    clip.close()
                except Exception:
                    self.duration = None
            elif ext in ['.glb', '.gltf', '.obj', '.fbx']:
                self.file_type = '3d'
                self.dimensions = "3D model (metadata extraction optional)"
            else:
                self.file_type = 'other'

        super().save(*args, **kwargs)

    def __str__(self):
=======
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

    #file = models.FileField(upload_to='uploads/')  # ✅ file upload field
    custom_fields = models.JSONField(default=dict, blank=True)
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    file_type = models.CharField(max_length=20, blank=True)
    file_size = models.FloatField(null=True, blank=True)       # MB
    resolution = models.CharField(max_length=50, blank=True)   # e.g., 1920x1080
    duration = models.FloatField(null=True, blank=True)        # seconds (videos)
    dimensions = models.CharField(max_length=100, blank=True)  # 3D model dimensions

    def save(self, *args, **kwargs):
        """Automatically detect and store metadata when saving a file"""
        if self.file:
            file_path = self.file.path
            self.asset_name = os.path.basename(self.file.name)

            # File size (in MB)
            self.file_size = round(self.file.size / (1024 * 1024), 2)

            # Detect file type by extension
            ext = os.path.splitext(self.file.name)[1].lower()
            if ext in ['.jpg', '.jpeg', '.png']:
                self.file_type = 'image'
                try:
                    with Image.open(self.file) as img:
                        self.resolution = f"{img.width}x{img.height}"
                except Exception:
                    self.resolution = "Unknown"
            elif ext in ['.mp4', '.mov', '.avi']:
                self.file_type = 'video'
                # Optional: can use moviepy for duration if installed
                try:
                    from moviepy.editor import VideoFileClip
                    clip = VideoFileClip(file_path)
                    self.duration = round(clip.duration, 2)
                    clip.close()
                except Exception:
                    self.duration = None
            elif ext in ['.glb', '.gltf', '.obj', '.fbx']:
                self.file_type = '3d'
                self.dimensions = "3D model (metadata extraction optional)"
            else:
                self.file_type = 'other'

        super().save(*args, **kwargs)

    def __str__(self):
>>>>>>> 49396cfbf75129b3ab146ef0a9b5d71c8b80bcad
        return self.asset_name