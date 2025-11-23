"""
Script to create or update superuser
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

username = 'admin'
email = 'admin@example.com'
password = 'admin123'

if User.objects.filter(username=username).exists():
    user = User.objects.get(username=username)
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.is_admin = True
    user.save()
    print(f'Superuser "{username}" password updated successfully!')
else:
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        is_admin=True
    )
    print(f'Superuser "{username}" created successfully!')

print(f'\nLogin credentials:')
print(f'Username: {username}')
print(f'Password: {password}')

