import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "your-secret-key"
DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [  # Installed applications
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "roles",
    "upload_download",
    "asset_preview",
    "asset_metadata.apps.AssetMetadataConfig", # for ready() auto cleanup method to run in apps.py  

]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",


    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",


]
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
ROOT_URLCONF = "backend.urls"


DATABASES = {   # Database configuration
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "dam_system",
        "USER": "postgres",
        "PASSWORD": "software",
        "HOST": "localhost",
        "PORT": "5432",
    }
}


CORS_ALLOWED_ORIGINS = ["http://localhost:3000","http://127.0.0.1:3000"]    #for api#
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = ["http://localhost:3000","http://127.0.0.1:3000"]    #for api#


STATIC_URL = "/static/"
MEDIA_URL = "/media/"   

MEDIA_ROOT = r"C:\media"    # This leads to c drive media folder



CORS_ALLOW_ALL_ORIGINS = True

REST_FRAMEWORK = {  # Django REST Framework configuration
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"



# TEMPLATES = [   # Template configuration
#     {
#         "BACKEND": "django.template.backends.django.DjangoTemplates",   
#         "DIRS": [],
#         "APP_DIRS": True,
#         "OPTIONS": {
#             "context_processors": [
#                 "django.template.context_processors.debug",
#                 "django.template.context_processors.request",
#                 "django.contrib.auth.context_processors.auth",
#                 "django.contrib.messages.context_processors.messages",
#             ],
#         },
#     },
# ]
