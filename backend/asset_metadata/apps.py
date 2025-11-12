
from django.apps import AppConfig
import os
from django.conf import settings

class AssetMetadataConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "asset_metadata"

    def ready(self):
        from asset_metadata.models import AssetMetadata

        # Build a set of all file paths in MEDIA_ROOT
        all_files_in_media = set()
        for root, dirs, files in os.walk(settings.MEDIA_ROOT):
            for f in files:
                full_path = os.path.normpath(os.path.join(root, f))
                all_files_in_media.add(full_path.lower())

        deleted_count = 0

        # Loop through DB records
        for asset in AssetMetadata.objects.all():
            file_name = asset.file_name.strip().lower()

            # Check if file exists anywhere in MEDIA_ROOT
            found = any(media_file.endswith(file_name) for media_file in all_files_in_media)

            if not found:
                asset.delete()
                deleted_count += 1

        if deleted_count > 0:
            print(f"[CLEANUP] Removed {deleted_count} orphan DB records.")
        else:
            print("[CLEANUP] No orphaned records found.")

    
'''    media_path = os.path.join(settings.MEDIA_ROOT, 'upload_download')
        all_files_in_media = []
        for root, dirs, files in os.walk(media_path):
            for f in files:
                all_files_in_media.append(os.path.join(root, f))

        db_files = [asset.upload_download.path for asset in AssetMetadata.objects.all() if asset.upload_download]
        orphaned_files = set(all_files_in_media) - set(db_files)

        for file_path in orphaned_files:
            os.remove(file_path)
            print(f"Deleted orphaned file: {file_path}")
    '''
        