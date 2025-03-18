from django.contrib.auth.views import LoginView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import SurveyResponse
from .serializers import SurveyResponseSerializer


class SubmitSurveyView(generics.CreateAPIView):
    queryset = SurveyResponse.objects.all()
    serializer_class = SurveyResponseSerializer


class SurveyResultsView(generics.ListAPIView):
    queryset = SurveyResponse.objects.prefetch_related('benefits').all()
    serializer_class = SurveyResponseSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class AdminLoginView(LoginView):
    template_name = "login.html"

    def get_success_url(self):
        """После успешного входа отправляет на API /api/results/"""
        return "/api/results/"