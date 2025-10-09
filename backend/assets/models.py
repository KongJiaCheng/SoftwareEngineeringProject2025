from django.db import models
from django.contrib.auth.models import User

class Asset(models.Model):
    ASSET_TYPES = [
        ("image", "Image"),
        ("video", "Video"),
        ("document", "Document"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to="uploads/")
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPES, default="other")
    tags = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    version = models.IntegerField(default=1)

    def __str__(self):
        return self.title
