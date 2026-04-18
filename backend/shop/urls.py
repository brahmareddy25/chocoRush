from django.urls import path

from . import views


urlpatterns = [
    path("auth/register", views.register_view),
    path("auth/login", views.login_view),
    path("auth/logout", views.logout_view),
    path("auth/session", views.session_view),
    path("auth/profile", views.profile_view),
    path("products", views.products_view),
    path("orders", views.orders_view),
    path("orders/<uuid:order_id>", views.order_detail_view),
    path("orders/<uuid:order_id>/rating", views.order_rating_view),
    path("admin/login", views.admin_login_view),
    path("admin/session", views.admin_session_view),
    path("admin/dashboard", views.admin_dashboard_view),
    path("admin/products/upsert", views.admin_upsert_product_view),
    path("admin/orders/<uuid:order_id>/status", views.admin_order_status_view),
]
