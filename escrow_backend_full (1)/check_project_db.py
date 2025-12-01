import os
import django
from indexer.models import Project

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_core.settings')
django.setup()

def check_project():
    try:
        projects = Project.objects.filter(title="Milestone Test Project")
        print(f"Found {projects.count()} projects with title 'Milestone Test Project'")
        for p in projects:
            print(f"ID: {p.project_id}, Status: {p.status}, Creator: {p.creator_address}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_project()
