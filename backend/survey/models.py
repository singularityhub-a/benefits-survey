from django.db import models


class SurveyResponse(models.Model):
    first_name = models.CharField(max_length=50, verbose_name="Имя")
    last_name = models.CharField(max_length=50, verbose_name="Фамилия")
    email = models.EmailField(unique=False, verbose_name="Email")
    institution = models.CharField(max_length=150, verbose_name="Место обучения")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Время ответа")

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.institution}) - {self.timestamp}"


class SelectedBenefit(models.Model):
    response = models.ForeignKey(SurveyResponse, related_name='benefits', on_delete=models.CASCADE)
    benefit = models.CharField(max_length=255, verbose_name="Преимущество")
    priority = models.IntegerField(verbose_name="Приоритет")

    class Meta:
        ordering = ['priority']

    def __str__(self):
        return f"{self.benefit} (приоритет {self.priority})"

