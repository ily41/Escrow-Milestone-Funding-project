from rest_framework import generics
from drf_spectacular.utils import extend_schema
from .models import KnowledgeTag
from .serializers import KnowledgeTagSerializer

@extend_schema(summary="Create knowledge tag (XML stored in DB)")
class KnowledgeTagCreateView(generics.CreateAPIView):
    queryset = KnowledgeTag.objects.all()
    serializer_class = KnowledgeTagSerializer

@extend_schema(summary="List knowledge tags")
class KnowledgeTagListView(generics.ListAPIView):
    queryset = KnowledgeTag.objects.all()
    serializer_class = KnowledgeTagSerializer

@extend_schema(summary="Retrieve a single knowledge tag")
class KnowledgeTagDetailView(generics.RetrieveAPIView):
    queryset = KnowledgeTag.objects.all()
    serializer_class = KnowledgeTagSerializer
