from django.test import TestCase
from django.contrib.auth.models import User
from .models import Asset
from django.core.files.uploadedfile import SimpleUploadedFile

class AssetModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='password123')
        self.test_file = SimpleUploadedFile(
            "test_image.jpg",
            b"file_content_here",
            content_type="image/jpeg"
        )
        self.asset = Asset.objects.create(
            name="Test Image",
            file=self.test_file,
            uploaded_by=self.user,
            tags="test,example"
        )

    def test_asset_creation(self):
        """Test that asset is created correctly"""
        self.assertEqual(self.asset.name, "Test Image")
        self.assertEqual(self.asset.uploaded_by.username, "tester")
        self.assertIn("test", self.asset.tags)

    def test_asset_str_method(self):
        """Test the string representation of an asset"""
        self.assertEqual(str(self.asset), "Test Image")
