from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0002_seed_products"),
    ]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="image",
            field=models.TextField(),
        ),
    ]
