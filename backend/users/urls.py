'''
# assets/urls.py
from rest_framework.routers import DefaultRouter
from .views import AssetViewSet, TagViewSet

router = DefaultRouter()
router.register(r"assets", AssetViewSet, basename="asset")
router.register(r"tags", TagViewSet)
'''

# users/urls.py
from django.urls import path
from .views import simple_login

urlpatterns = [
    path('auth/simple-login/', simple_login, name='simple-login'),
]
