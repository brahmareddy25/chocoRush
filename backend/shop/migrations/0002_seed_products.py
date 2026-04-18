from django.db import migrations

from shop.sample_data import SAMPLE_CHOCOLATES


def seed_products(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    for item in SAMPLE_CHOCOLATES:
        Product.objects.update_or_create(
            id=item["id"],
            defaults=item,
        )


def unseed_products(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    Product.objects.filter(id__in=[item["id"] for item in SAMPLE_CHOCOLATES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_products, unseed_products),
    ]
