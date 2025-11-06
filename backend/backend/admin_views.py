from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth.decorators import user_passes_test
import json
import random
import string

def admin_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Login required'}, status=401)
        if not hasattr(request.user, 'userprofile') or request.user.userprofile.role != 'admin':
            return JsonResponse({'error': 'Admin access required'}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper

@csrf_exempt
@admin_required
def create_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            role = data.get('role', 'viewer')
            
            if role not in ['admin', 'editor', 'viewer']:
                return JsonResponse({'success': False, 'error': 'Invalid role'}, status=400)
            
            # Generate random username based on role
            random_id = ''.join(random.choices(string.digits, k=6))
            
            if role == 'editor':
                username = f"editor{random_id}@gmail.com"
            elif role == 'admin':
                username = f"admin{random_id}@gmail.com"
            else:
                username = f"viewer{random_id}@gmail.com"
                
            password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
            
            # Create user
            user = User.objects.create_user(
                username=username,
                email=username,
                password=password
            )
            
            # Set role
            user.userprofile.role = role
            user.userprofile.save()
            
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'role': role,
                    'password': password  # Return for admin to see
                }
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@admin_required
def delete_user(request, user_id):
    if request.method == 'DELETE':
        try:
            user = User.objects.get(id=user_id)
            
            # Prevent admin from deleting themselves
            if user == request.user:
                return JsonResponse({'success': False, 'error': 'Cannot delete yourself'}, status=400)
                
            user.delete()
            return JsonResponse({'success': True})
            
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'}, status=404)

@csrf_exempt
@admin_required
def change_role(request, user_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_role = data.get('role')
            
            if new_role not in ['admin', 'editor', 'viewer']:
                return JsonResponse({'success': False, 'error': 'Invalid role'}, status=400)
            
            user = User.objects.get(id=user_id)
            user.userprofile.role = new_role
            user.userprofile.save()
            
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'role': new_role
                }
            })
            
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'}, status=404)

@admin_required
def list_users(request):
    users = User.objects.all().select_related('userprofile')
    user_list = []
    
    for user in users:
        user_list.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.userprofile.role,
            'date_joined': user.date_joined.strftime('%Y-%m-%d')
        })
    
    return JsonResponse({'users': user_list})