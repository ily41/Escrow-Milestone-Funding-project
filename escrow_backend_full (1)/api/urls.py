from django.urls import path
from .views import (
    ProjectListView, ProjectDetailView,
    ProjectMilestonesView, ProjectPledgesView,
    ProjectCreateView, MilestoneCreateView, PledgeCreateView,
    HistoryView, TransactionDetailView,
    AdminResolveView, AdminLogsView, AdminMetricsView,
    ProjectStatusUpdateView,
)

urlpatterns = [
    path("projects", ProjectListView.as_view(), name="projects-list"),
    path("projects/create", ProjectCreateView.as_view(), name="projects-create"),
    path("projects/<str:project_id>", ProjectDetailView.as_view(), name="projects-detail"),
    path("projects/<str:project_id>/milestones", ProjectMilestonesView.as_view(), name="projects-milestones"),
    path("projects/<str:project_id>/milestones/create", MilestoneCreateView.as_view(), name="milestones-create"),
    path("projects/<str:project_id>/pledges", ProjectPledgesView.as_view(), name="projects-pledges"),
    path("projects/<str:project_id>/pledge", PledgeCreateView.as_view(), name="pledge-create"),
    path("history", HistoryView.as_view(), name="history"),
    path("tx/<str:tx_hash>", TransactionDetailView.as_view(), name="tx-detail"),
    path("admin/resolve", AdminResolveView.as_view(), name="admin-resolve"),
    path("admin/logs", AdminLogsView.as_view(), name="admin-logs"),
    path("admin/metrics", AdminMetricsView.as_view(), name="admin-metrics"),
    path("projects/<str:project_id>/status/", ProjectStatusUpdateView.as_view(), name="project-status-update"),
]
