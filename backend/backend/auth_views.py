import json
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from roles.models import UserProfile  # 🔥 import your profile model


@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)

    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return JsonResponse(
            {"success": False, "error": "Username and password required"},
            status=400,
        )

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse(
            {"success": False, "error": "Invalid username or password"},
            status=400,
        )

    # 🔥 create Django session (sets sessionid cookie)
    login(request, user)

    # ----- ROLE HANDLING (using roles.UserProfile + related_name="profile") -----
    # Try to get existing profile
    profile = getattr(user, "profile", None)

    # If this is a Django admin/staff account, force role=admin
    if user.is_superuser or user.is_staff:
        if profile is None:
            profile, _ = UserProfile.objects.get_or_create(user=user)
        if profile.role != UserProfile.Role.ADMIN:
            profile.role = UserProfile.Role.ADMIN
            profile.save()
        role = UserProfile.Role.ADMIN
    else:
        # Normal user: use profile.role if profile exists, else default viewer
        if profile is None:
            profile, _ = UserProfile.objects.get_or_create(user=user)
        role = profile.role or UserProfile.Role.VIEWER

    return JsonResponse(
        {
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": role,
            },
        }
    )
