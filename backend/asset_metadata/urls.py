from django.urls import path
from . import views

urlpatterns = [
    path("", views.metadata_list, name="metadata_list"),
]
