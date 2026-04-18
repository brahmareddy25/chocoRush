import uuid

from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=25, blank=True)
    addresses = models.JSONField(default=list, blank=True)
    default_address_id = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Product(models.Model):
    id = models.CharField(max_length=120, primary_key=True)
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=80, default="Chocolate")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.TextField()
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.5)
    description = models.CharField(max_length=400, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Order(models.Model):
    STATUS_CHOICES = [
        ("Placed", "Placed"),
        ("Accepted", "Accepted"),
        ("Preparing", "Preparing"),
        ("Delivered", "Delivered"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    user_email = models.EmailField(blank=True)
    items = models.JSONField(default=list)
    pricing = models.JSONField(default=dict)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Placed")
    address_fields = models.JSONField(default=dict, blank=True)
    address = models.CharField(max_length=500)
    phone = models.CharField(max_length=25, blank=True)
    payment_method = models.CharField(max_length=20, default="cod")
    payment = models.JSONField(default=dict, blank=True)
    expected_delivery_date = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    rating = models.PositiveSmallIntegerField(null=True, blank=True)
    rating_message = models.CharField(max_length=500, blank=True)
    rated_at = models.DateTimeField(null=True, blank=True)
    admin_note = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class AdminSession(models.Model):
    token = models.CharField(max_length=128, primary_key=True)
    username = models.CharField(max_length=120)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
