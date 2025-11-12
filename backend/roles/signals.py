from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile

@receiver(post_save, sender=User)
def create_or_update_profile(sender, instance, created, **kwargs):
    if created:
        # create only if it doesn’t exist (avoid duplicate key)
        UserProfile.objects.get_or_create(user=instance)
    # Do NOT update or reset the role on user updates
