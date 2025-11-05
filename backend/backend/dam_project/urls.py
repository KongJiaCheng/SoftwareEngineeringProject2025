from django.urls import path
from . import views
from . import admin_views

urlpatterns = [
    path('api/auth/token/', views.login_api, name='login_api'),
    
    # Admin routes
    path('api/admin/users/', admin_views.list_users, name='list_users'),
    path('api/admin/users/create/', admin_views.create_user, name='create_user'),
    path('api/admin/users/<int:user_id>/delete/', admin_views.delete_user, name='delete_user'),
    path('api/admin/users/<int:user_id>/change-role/', admin_views.change_role, name='change_role'),
]