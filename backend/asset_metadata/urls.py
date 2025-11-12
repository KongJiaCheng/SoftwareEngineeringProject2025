from django.urls import path
from . import views

urlpatterns = [
    path("", views.metadata_list, name="metadata_list"),
    #path('delete/<int:asset_id>/', views.delete_asset, name='delete_asset'),
]

