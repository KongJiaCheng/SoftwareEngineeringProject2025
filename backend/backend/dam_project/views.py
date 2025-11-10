from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
import json

@csrf_exempt
def login_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            # Authenticate user
            user = authenticate(username=username, password=password)
            
            if user is not None:
                # Get user role from UserProfile
                role = user.userprofile.role if hasattr(user, 'userprofile') else 'viewer'
                
                # Login successful - return user info with role
                return JsonResponse({
                    'success': True,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'role': role
                    }
                })
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid username or password'
                }, status=401)
                
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': 'Server error'
            }, status=500)