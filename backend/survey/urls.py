from django.urls import path
from .views import SubmitSurveyView, SurveyResultsView, AdminLoginView

urlpatterns = [
    path('api/survey/', SubmitSurveyView.as_view(), name='submit_survey'),
    path('api/results/', SurveyResultsView.as_view(), name='survey_results'),
    path('api/login/', AdminLoginView.as_view(), name='admin-login'),
]
