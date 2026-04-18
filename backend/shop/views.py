import json
import os
import secrets
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from .emails import (
    send_expected_delivery_email,
    send_order_confirmation_email,
    send_order_status_update_email,
    send_profile_updated_email,
    send_welcome_email,
)
from .models import AdminSession, Order, Product, Profile


ADMIN_USERNAME = os.environ.get("CHOCORUSH_ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("CHOCORUSH_ADMIN_PASSWORD", "Admin@123")


def parse_json(request):
    if not request.body:
        return {}
    return json.loads(request.body.decode("utf-8"))


def json_error(message, status=400):
    return JsonResponse({"message": message}, status=status)


def money(value, fallback="0"):
    try:
        return Decimal(str(value if value is not None else fallback)).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal(str(fallback)).quantize(Decimal("0.01"))


def decimal_to_places(value, places="0.1", fallback="0"):
    try:
        return Decimal(str(value if value is not None else fallback)).quantize(Decimal(places))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal(str(fallback)).quantize(Decimal(places))


def normalize_items(items):
    if not isinstance(items, list) or not items:
        raise ValueError("Order must include at least one item.")

    normalized = []
    for item in items:
        normalized.append(
            {
                "id": str(item.get("id", "")),
                "name": str(item.get("name", ""))[:120],
                "price": float(money(item.get("price", 0))),
                "quantity": int(item.get("quantity", 0)),
                "image": str(item.get("image", "")),
            }
        )

    if any(item["quantity"] <= 0 or item["price"] <= 0 for item in normalized):
        raise ValueError("Each order item must include a valid price and quantity.")

    return normalized


def serialize_user(user):
    return {
        "uid": str(user.id),
        "displayName": user.get_full_name() or user.username,
        "email": user.email,
        "providerData": [{"providerId": "password"}],
    }


def serialize_profile(profile):
    return {
        "uid": str(profile.user_id),
        "name": profile.user.get_full_name() or profile.user.username,
        "email": profile.user.email,
        "phone": profile.phone,
        "addresses": profile.addresses or [],
        "defaultAddressId": profile.default_address_id or "",
        "createdAt": profile.created_at.isoformat(),
        "updatedAt": profile.updated_at.isoformat(),
    }


def serialize_product(product):
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "price": float(product.price),
        "image": product.image,
        "rating": float(product.rating),
        "description": product.description,
        "isActive": product.is_active,
        "createdAt": product.created_at.isoformat(),
        "updatedAt": product.updated_at.isoformat(),
    }


def serialize_order(order):
    return {
        "id": str(order.id),
        "userId": str(order.user_id),
        "userEmail": order.user_email,
        "items": order.items,
        "pricing": order.pricing,
        "subtotal": float(order.subtotal),
        "total": float(order.total),
        "status": order.status,
        "addressFields": order.address_fields,
        "address": order.address,
        "phone": order.phone,
        "paymentMethod": order.payment_method,
        "payment": order.payment,
        "expectedDeliveryDate": order.expected_delivery_date.isoformat() if order.expected_delivery_date else "",
        "deliveredAt": order.delivered_at.isoformat() if order.delivered_at else "",
        "rating": order.rating,
        "ratingMessage": order.rating_message,
        "ratedAt": order.rated_at.isoformat() if order.rated_at else "",
        "adminNote": order.admin_note,
        "createdAt": order.created_at.isoformat(),
        "updatedAt": order.updated_at.isoformat(),
    }


def get_or_create_profile(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile


def require_user(request):
    if not request.user.is_authenticated:
        return None, json_error("Login is required.", 401)
    return request.user, None


def require_admin_session(session_token):
    if not session_token:
        return None, json_error("Admin session is missing.", 401)

    session = AdminSession.objects.filter(token=str(session_token)).first()
    if not session or session.expires_at <= timezone.now():
        return None, json_error("Admin session expired.", 403)

    return session, None


@csrf_exempt
@require_http_methods(["POST"])
def register_view(request):
    payload = parse_json(request)
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not name or not email or not password:
        return json_error("Name, email, and password are required.")
    if User.objects.filter(username=email).exists():
        return json_error("An account with this email already exists.", 409)

    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    get_or_create_profile(user)
    login(request, user)
    send_welcome_email(user)

    return JsonResponse({"user": serialize_user(user), "profile": serialize_profile(user.profile)})


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    payload = parse_json(request)
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    user = authenticate(request, username=email, password=password)
    if not user:
        return json_error("Invalid email or password.", 403)

    login(request, user)
    profile = get_or_create_profile(user)
    return JsonResponse({"user": serialize_user(user), "profile": serialize_profile(profile)})


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({"ok": True})


@require_GET
def session_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"user": None, "profile": None})

    profile = get_or_create_profile(request.user)
    return JsonResponse({"user": serialize_user(request.user), "profile": serialize_profile(profile)})


@csrf_exempt
@require_http_methods(["GET", "PUT"])
def profile_view(request):
    user, error = require_user(request)
    if error:
        return error

    profile = get_or_create_profile(user)

    if request.method == "GET":
        return JsonResponse({"profile": serialize_profile(profile)})

    payload = parse_json(request)
    name = str(payload.get("name", user.get_full_name() or "")).strip()
    phone = str(payload.get("phone", profile.phone or "")).strip()
    addresses = payload.get("addresses", profile.addresses or [])
    default_address_id = str(payload.get("defaultAddressId", profile.default_address_id or "")).strip()
    current_password = str(payload.get("currentPassword", ""))
    new_password = str(payload.get("newPassword", ""))

    if new_password:
        if not current_password or not user.check_password(current_password):
            return json_error("Current password is required to set a new password.", 400)
        user.set_password(new_password)

    user.first_name = name
    user.email = user.username
    user.save()

    profile.phone = phone
    profile.addresses = addresses if isinstance(addresses, list) else []
    profile.default_address_id = default_address_id
    profile.save()

    if new_password:
        login(request, user)

    send_profile_updated_email(user, profile, password_changed=bool(new_password))
    return JsonResponse({"user": serialize_user(user), "profile": serialize_profile(profile)})


@require_GET
def products_view(request):
    products = Product.objects.order_by("-rating", "name")
    return JsonResponse({"products": [serialize_product(product) for product in products]})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def orders_view(request):
    user, error = require_user(request)
    if error:
        return error

    if request.method == "GET":
        orders = Order.objects.filter(user=user).order_by("-created_at")
        return JsonResponse({"orders": [serialize_order(order) for order in orders]})

    payload = parse_json(request)

    try:
        items = normalize_items(payload.get("items", []))
    except ValueError as exc:
        return json_error(str(exc))

    pricing = payload.get("pricing", {}) if isinstance(payload.get("pricing", {}), dict) else {}
    payment_method = str(payload.get("paymentMethod", "cod")).strip().lower() or "cod"
    subtotal = money(pricing.get("subtotal", sum(item["price"] * item["quantity"] for item in items)))
    gst = money(pricing.get("gst", subtotal * Decimal("0.018")))
    delivery_charge = money(pricing.get("deliveryCharge", 60))
    cod_charge = money(pricing.get("codCharge", 10 if payment_method == "cod" else 0))
    final_amount = money(pricing.get("finalAmount", subtotal + gst + delivery_charge + cod_charge))

    address_fields = payload.get("addressFields", {}) if isinstance(payload.get("addressFields", {}), dict) else {}
    address = str(payload.get("address", "")).strip()
    phone = str(payload.get("phone", "")).strip()
    if not address or not phone:
        return json_error("Address and phone are required.")

    order = Order.objects.create(
        user=user,
        user_email=user.email,
        items=items,
        pricing={
            "subtotal": float(subtotal),
            "gst": float(gst),
            "deliveryCharge": float(delivery_charge),
            "codCharge": float(cod_charge),
            "finalAmount": float(final_amount),
        },
        subtotal=subtotal,
        total=final_amount,
        address_fields=address_fields,
        address=address[:500],
        phone=phone[:25],
        payment_method=payment_method,
        payment={
            "provider": "cash_on_delivery" if payment_method == "cod" else "local_test_gateway",
            "verifiedAt": timezone.now().isoformat() if payment_method != "cod" else None,
        },
    )

    send_order_confirmation_email(order)
    return JsonResponse({"orderId": str(order.id), "order": serialize_order(order)})


@require_GET
def order_detail_view(request, order_id):
    user, error = require_user(request)
    if error:
        return error

    order = get_object_or_404(Order, id=order_id, user=user)
    return JsonResponse({"order": serialize_order(order)})


@csrf_exempt
@require_http_methods(["POST"])
def order_rating_view(request, order_id):
    user, error = require_user(request)
    if error:
        return error

    order = get_object_or_404(Order, id=order_id, user=user)
    payload = parse_json(request)
    rating = int(payload.get("rating", 0))
    message = str(payload.get("message", ""))[:500]

    if rating < 1 or rating > 5:
        return json_error("A valid rating is required.")

    order.rating = rating
    order.rating_message = message
    order.rated_at = timezone.now()
    order.save(update_fields=["rating", "rating_message", "rated_at", "updated_at"])
    return JsonResponse({"ok": True})


@csrf_exempt
@require_http_methods(["POST"])
def admin_login_view(request):
    payload = parse_json(request)
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))

    if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
        return json_error("Invalid admin credentials.", 403)

    token = secrets.token_hex(32)
    expires_at = timezone.now() + timedelta(hours=12)
    AdminSession.objects.create(token=token, username=username, expires_at=expires_at)

    return JsonResponse(
        {
            "token": token,
            "username": username,
            "expiresAt": expires_at.isoformat(),
        }
    )


@require_GET
def admin_session_view(request):
    session_token = request.headers.get("X-Admin-Session", "")
    session, error = require_admin_session(session_token)
    if error:
        return JsonResponse({"authenticated": False}, status=401)

    return JsonResponse(
        {
            "authenticated": True,
            "username": session.username,
            "expiresAt": session.expires_at.isoformat(),
        }
    )


@require_GET
def admin_dashboard_view(request):
    session_token = request.headers.get("X-Admin-Session", "")
    _, error = require_admin_session(session_token)
    if error:
        return error

    orders = Order.objects.all().order_by("-created_at")
    products = Product.objects.all().order_by("name")
    return JsonResponse(
        {
            "orders": [serialize_order(order) for order in orders],
            "products": [serialize_product(product) for product in products],
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def admin_upsert_product_view(request):
    session_token = request.headers.get("X-Admin-Session", "")
    _, error = require_admin_session(session_token)
    if error:
        return error

    payload = parse_json(request)
    product = payload.get("product", {}) if isinstance(payload.get("product", {}), dict) else {}
    product_id = str(product.get("id", "")).strip() or secrets.token_hex(8)
    name = str(product.get("name", "")).strip()
    image = str(product.get("image", "")).strip()
    price = money(product.get("price", 0))

    if not name or not image or price <= 0:
        return json_error("Product name, image, and price are required.")

    item, _ = Product.objects.update_or_create(
        id=product_id,
        defaults={
            "name": name[:120],
            "category": str(product.get("category", "Chocolate"))[:80],
            "price": price,
            "image": image[:500],
            "rating": decimal_to_places(product.get("rating", 4.5), "0.1", "4.5"),
            "description": str(product.get("description", ""))[:400],
            "is_active": product.get("isActive", True) is not False,
        },
    )

    return JsonResponse({"id": item.id, "product": serialize_product(item)})


@csrf_exempt
@require_http_methods(["POST"])
def admin_order_status_view(request, order_id):
    session_token = request.headers.get("X-Admin-Session", "")
    _, error = require_admin_session(session_token)
    if error:
        return error

    payload = parse_json(request)
    status = str(payload.get("status", "Placed"))[:20]
    expected_delivery_date = str(payload.get("expectedDeliveryDate", "")).strip()
    note = str(payload.get("note", ""))[:300]

    order = get_object_or_404(Order, id=order_id)
    previous_expected_delivery_date = order.expected_delivery_date
    previous_status = order.status
    order.status = status
    order.admin_note = note
    order.expected_delivery_date = (
        datetime.fromisoformat(f"{expected_delivery_date}T12:00:00+05:30")
        if expected_delivery_date
        else None
    )
    if status == "Delivered":
        order.delivered_at = timezone.now()
    order.save()

    expected_delivery_changed = order.expected_delivery_date != previous_expected_delivery_date
    status_changed = status != previous_status

    if status_changed or expected_delivery_changed:
        send_order_status_update_email(
            order,
            previous_status=previous_status,
            expected_delivery_changed=expected_delivery_changed,
        )
    elif order.expected_delivery_date:
        send_expected_delivery_email(order)

    return JsonResponse({"ok": True, "order": serialize_order(order)})
