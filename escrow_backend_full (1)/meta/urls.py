from django.urls import path
from .views import KnowledgeTagCreateView, KnowledgeTagListView, KnowledgeTagDetailView

urlpatterns = [
    path("tags/create", KnowledgeTagCreateView.as_view(), name="meta-tags-create"),
    path("tags", KnowledgeTagListView.as_view(), name="meta-tags-list"),
    path("tags/<int:pk>", KnowledgeTagDetailView.as_view(), name="meta-tags-detail"),
]
