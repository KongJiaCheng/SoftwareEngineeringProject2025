# backend/upload_download/apps.py
from django.apps import AppConfig

class UploadDownloadConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "upload_download"
    verbose_name = "UPLOAD & DOWNLOAD"
