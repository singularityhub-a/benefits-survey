from rest_framework import serializers
from .models import SurveyResponse, SelectedBenefit

class SelectedBenefitSerializer(serializers.ModelSerializer):
    class Meta:
        model = SelectedBenefit
        fields = ['benefit', 'priority']

class SurveyResponseSerializer(serializers.ModelSerializer):
    benefits = SelectedBenefitSerializer(many=True)

    class Meta:
        model = SurveyResponse
        fields = ['id', 'first_name', 'last_name', 'institution', 'timestamp', 'benefits']

    def create(self, validated_data):
        benefits_data = validated_data.pop('benefits')
        response = SurveyResponse.objects.create(**validated_data)
        for benefit_data in benefits_data:
            SelectedBenefit.objects.create(response=response, **benefit_data)
        return response
