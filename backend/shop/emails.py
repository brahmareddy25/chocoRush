import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone


logger = logging.getLogger(__name__)


def _local_datetime(value):
    if not value:
        return ""
    return timezone.localtime(value).strftime("%d %b %Y, %I:%M %p")


def _order_items_text(order):
    return "\n".join(
        f"- {item.get('name', 'Item')} x{item.get('quantity', 0)}"
        for item in (order.items or [])
    )


def send_customer_email(subject, message, recipient):
    if not recipient:
        return

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Unable to send email '%s' to %s", subject, recipient)


def send_welcome_email(user):
    send_customer_email(
        subject="Welcome to ChocoRush",
        message=(
            f"Hi {user.get_full_name() or user.username},\n\n"
            "Your ChocoRush account is ready.\n"
            "You can now sign in, save addresses, and place orders.\n\n"
            "Thanks,\nChocoRush"
        ),
        recipient=user.email,
    )


def send_profile_updated_email(user, profile, password_changed=False):
    send_customer_email(
        subject="Your ChocoRush profile was updated",
        message=(
            f"Hi {user.get_full_name() or user.username},\n\n"
            "Your profile details were updated successfully.\n"
            f"Phone: {profile.phone or 'Not set'}\n"
            f"Saved addresses: {len(profile.addresses or [])}\n"
            f"Password updated: {'Yes' if password_changed else 'No'}\n\n"
            "If you did not make this change, please contact support immediately.\n\n"
            "Thanks,\nChocoRush"
        ),
        recipient=user.email,
    )


def send_order_confirmation_email(order):
    send_customer_email(
        subject=f"Order placed successfully #{str(order.id)[:8]}",
        message=(
            f"Hi {order.user.get_full_name() or order.user.username},\n\n"
            "Your order has been placed successfully.\n"
            f"Order ID: {order.id}\n"
            f"Payment method: {order.payment_method.upper()}\n"
            f"Total: INR {int(order.total)}\n"
            f"Delivery address: {order.address}\n\n"
            f"Items:\n{_order_items_text(order)}\n\n"
            "We will share delivery updates by email.\n\n"
            "Thanks,\nChocoRush"
        ),
        recipient=order.user_email,
    )


def send_expected_delivery_email(order):
    if not order.expected_delivery_date:
        return

    send_customer_email(
        subject=f"Expected delivery updated for order #{str(order.id)[:8]}",
        message=(
            f"Hi {order.user.get_full_name() or order.user.username},\n\n"
            "Your order delivery estimate has been updated.\n"
            f"Expected delivery: {_local_datetime(order.expected_delivery_date)}\n"
            f"Current status: {order.status}\n\n"
            "Thanks,\nChocoRush"
        ),
        recipient=order.user_email,
    )


def send_order_status_update_email(order, previous_status="", expected_delivery_changed=False):
    expected_delivery_line = (
        f"Expected delivery: {_local_datetime(order.expected_delivery_date)}\n"
        if order.expected_delivery_date
        else "Expected delivery: Not set yet\n"
    )
    previous_status_line = f"Previous status: {previous_status}\n" if previous_status else ""
    note_line = f"Admin note: {order.admin_note}\n" if order.admin_note else ""
    delivery_line = (
        f"Delivered at: {_local_datetime(order.delivered_at)}\n"
        if order.status == "Delivered" and order.delivered_at
        else ""
    )
    subject = f"Order status updated to {order.status} #{str(order.id)[:8]}"
    if expected_delivery_changed and order.expected_delivery_date:
        subject = f"Order update with expected delivery #{str(order.id)[:8]}"

    send_customer_email(
        subject=subject,
        message=(
            f"Hi {order.user.get_full_name() or order.user.username},\n\n"
            "Your order has been updated by ChocoRush.\n"
            f"Order ID: {order.id}\n"
            f"{previous_status_line}"
            f"Current status: {order.status}\n"
            f"{expected_delivery_line}"
            f"{delivery_line}"
            f"{note_line}\n"
            "We will keep you posted on further changes.\n\n"
            "Thanks,\nChocoRush"
        ),
        recipient=order.user_email,
    )


def send_delivered_email(order):
    send_customer_email(
        subject=f"Order delivered #{str(order.id)[:8]}",
        message=(
            f"Hi {order.user.get_full_name() or order.user.username},\n\n"
            "Your order has been marked as delivered.\n"
            f"Delivered at: {_local_datetime(order.delivered_at)}\n"
            f"Delivery address: {order.address}\n\n"
            "We hope you enjoy your chocolates.\n\n"
            "Thanks,\nChocoRush"
        ),
        recipient=order.user_email,
    )
