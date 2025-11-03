# from django.db import models
# from django.contrib.postgres.fields import ArrayField
# from django.db.models import JSONField
# from PIL import Image        # to read image metadata
# import os

# class Asset(models.Model):
#     name = models.CharField(max_length=255)
#     file = models.FileField(upload_to="uploads/%Y/%m/%d/")
#     uploaded_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name

# class AssetVersion(models.Model):
#     asset = models.ForeignKey(Asset, related_name="versions", on_delete=models.CASCADE)
#     version_no = models.PositiveIntegerField(default=1)
#     file = models.FileField(upload_to="uploads/%Y/%m/%d/")
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         unique_together = ("asset", "version_no")

#     def __str__(self):
#         return f"{self.asset_id}-v{self.version_no}"
