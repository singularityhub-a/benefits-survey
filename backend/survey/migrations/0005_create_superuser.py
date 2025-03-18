from django.db import migrations
import os
from django.contrib.auth import get_user_model


def create_superuser(apps, schema_editor):
    User = get_user_model()

    username = os.getenv('DJANGO_SUPERUSER_USERNAME')
    email = os.getenv('DJANGO_SUPERUSER_EMAIL')
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD')

    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"Superuser {username} created!")
    else:
        print("Superuser already exists.")


class Migration(migrations.Migration):
    dependencies = [
        ('yourapp', 'previous_migration_name'),  # Замени на последнюю миграцию
    ]

    operations = [
        migrations.RunPython(create_superuser),
    ]
