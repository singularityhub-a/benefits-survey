from django.urls import path
from .views import SubmitSurveyView, SurveyResultsView

urlpatterns = [
    path('api/survey/', SubmitSurveyView.as_view(), name='submit_survey'),
    path('api/results/', SurveyResultsView.as_view(), name='survey_results'),
]
