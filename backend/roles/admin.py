from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    fields = ("role",)          # show role dropdown
    can_delete = False
    fk_name = "user"
    extra = 0                   # prevents blank extra inline

class CustomUserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = BaseUserAdmin.list_display + ("get_role",)

    # Hides inline when adding new user (prevents duplicate key issue)
    def get_inlines(self, request, obj=None):
        return self.inlines if obj else []

    def get_role(self, obj):
        return getattr(obj.profile, "role", "")
    get_role.short_description = "Role"

# Replace the default User admin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
