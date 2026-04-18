from django.contrib import admin

from .models import AdminSession, Order, Product, Profile


admin.site.register(Profile)
admin.site.register(Product)
admin.site.register(Order)
admin.site.register(AdminSession)
