from django.apps import AppConfig
import os
from django.conf import settings

class AssetMetadataConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "asset_metadata"

    def ready(self):
        from django.db.utils import OperationalError, ProgrammingError
        from asset_metadata.models import AssetMetadata

        try:
            # Ensure the database is ready before querying
            all_files_in_media = set()
            for root, dirs, files in os.walk(settings.MEDIA_ROOT):
                for f in files:
                    full_path = os.path.normpath(os.path.join(root, f))
                    all_files_in_media.add(full_path.lower())

            deleted_count = 0

            for asset in AssetMetadata.objects.all():
                file_name = asset.file_name.strip().lower()
                found = any(media_file.endswith(file_name) for media_file in all_files_in_media)

                if not found:
                    asset.delete()
                    deleted_count += 1

            if deleted_count > 0:
                print(f"[CLEANUP] Removed {deleted_count} orphan DB records.")
            else:
                print("[CLEANUP] No orphaned records found.")

        except (OperationalError, ProgrammingError):
            # Skip cleanup if database is not ready or schema mismatch occurs
            print("[CLEANUP SKIPPED] Database not ready or table missing columns.")
