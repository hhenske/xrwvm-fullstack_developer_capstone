from django.db import models
from django.utils.timezone import now
from django.core.validators import MaxValueValidator, MinValueValidator


# Create your models here.

class CarMake(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()

    def __str__ (self):
        return self.name

class CarModel(models.Model):
    car_make = models.ForeignKey('carMake', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    CAR_TYPES = [
        ('SEDAN', 'Sedan'),
        ('SUV', 'SUV'),
        ('WAGON', 'Wagon'),
        ('VAN', 'Van'),
        ('CONVERTIBLE', 'Convertible')
    ]
    type = models.CharField(max_length=12, choices=CAR_TYPES, default="SUV")
    year = models.IntegerField(default=2023,
        validators=[
            MaxValueValidator(2025),
            MinValueValidator(2016)
        ]) 

    def __str__ (self):
        return self.name


