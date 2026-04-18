from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AdminSession",
            fields=[
                ("token", models.CharField(max_length=128, primary_key=True, serialize=False)),
                ("username", models.CharField(max_length=120)),
                ("expires_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.CharField(max_length=120, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=120)),
                ("category", models.CharField(default="Chocolate", max_length=80)),
                ("price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("image", models.URLField(max_length=500)),
                ("rating", models.DecimalField(decimal_places=1, default=4.5, max_digits=3)),
                ("description", models.CharField(blank=True, max_length=400)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="Profile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("phone", models.CharField(blank=True, max_length=25)),
                ("addresses", models.JSONField(blank=True, default=list)),
                ("default_address_id", models.CharField(blank=True, max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("user_email", models.EmailField(blank=True, max_length=254)),
                ("items", models.JSONField(default=list)),
                ("pricing", models.JSONField(default=dict)),
                ("subtotal", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("total", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("status", models.CharField(choices=[("Placed", "Placed"), ("Accepted", "Accepted"), ("Preparing", "Preparing"), ("Delivered", "Delivered")], default="Placed", max_length=20)),
                ("address_fields", models.JSONField(blank=True, default=dict)),
                ("address", models.CharField(max_length=500)),
                ("phone", models.CharField(blank=True, max_length=25)),
                ("payment_method", models.CharField(default="cod", max_length=20)),
                ("payment", models.JSONField(blank=True, default=dict)),
                ("expected_delivery_date", models.DateTimeField(blank=True, null=True)),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
                ("rating", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("rating_message", models.CharField(blank=True, max_length=500)),
                ("rated_at", models.DateTimeField(blank=True, null=True)),
                ("admin_note", models.CharField(blank=True, max_length=300)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="orders", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
