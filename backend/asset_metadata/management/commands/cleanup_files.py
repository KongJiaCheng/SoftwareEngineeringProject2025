'''
from django.core.management.base import BaseCommand
from asset_metadata.models import AssetMetadata
import os
from django.conf import settings

class Command(BaseCommand):
    help = "Delete database entries whose files are missing in MEDIA_ROOT"

    def handle(self, *args, **kwargs):
        deleted_count = 0

        for asset in AssetMetadata.objects.all():
            # Use the correct model field
            file_path = os.path.join(settings.MEDIA_ROOT, asset.file_name)

            if not os.path.exists(file_path):
                asset.delete()
                deleted_count += 1
                self.stdout.write(f"Deleted DB record for missing file: {file_path}")

        self.stdout.write(f"Cleanup completed. Total deleted records: {deleted_count}")

'''

from django.core.management.base import BaseCommand
from asset_metadata.models import AssetMetadata
import os
from django.conf import settings

class Command(BaseCommand):
    help = "Delete database entries whose files are missing anywhere in MEDIA_ROOT"

    def handle(self, *args, **kwargs):
        deleted_count = 0

        # Build a set of all file paths in MEDIA_ROOT (including subfolders)
        all_files_in_media = set()
        for root, dirs, files in os.walk(settings.MEDIA_ROOT):
            for f in files:
                full_path = os.path.normpath(os.path.join(root, f))
                all_files_in_media.add(full_path.lower())  # lowercase to avoid case issues

        for asset in AssetMetadata.objects.all():
            file_name = asset.file_name.strip().lower()  # lowercase for comparison

            # Check if file exists anywhere in MEDIA_ROOT
            found = False
            for media_file in all_files_in_media:
                if media_file.endswith(file_name):
                    found = True
                    break

            if not found:
                asset.delete()
                deleted_count += 1
                self.stdout.write(f"Deleted DB record for missing file: {asset.file_name}")
            else:
                self.stdout.write(f"File exists, keeping record: {asset.file_name}")

        self.stdout.write(f"Cleanup completed. Total deleted records: {deleted_count}")