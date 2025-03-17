from rest_framework import generics
from .models import SurveyResponse
from .serializers import SurveyResponseSerializer

class SubmitSurveyView(generics.CreateAPIView):
    queryset = SurveyResponse.objects.all()
    serializer_class = SurveyResponseSerializer

class SurveyResultsView(generics.ListAPIView):
    queryset = SurveyResponse.objects.prefetch_related('benefits').all()
    serializer_class = SurveyResponseSerializer
