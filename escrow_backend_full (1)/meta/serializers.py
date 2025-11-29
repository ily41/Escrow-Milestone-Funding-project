from rest_framework import serializers
from .models import KnowledgeTag

class KnowledgeTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeTag
        fields = "__all__"
