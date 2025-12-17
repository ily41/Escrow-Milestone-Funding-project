import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'escrow_backend.settings')
django.setup()

from projects.models import Project

def clear_onchain_ids():
    projects = Project.objects.filter(onchain_project_id__isnull=False)
    count = projects.count()
    print(f"Found {count} projects with onchain_project_id set.")
    
    for project in projects:
        print(f"Clearing onchain_id {project.onchain_project_id} from project '{project.title}' (ID: {project.id})")
        project.onchain_project_id = None
        project.save()
        
    print("All onchain_project_ids cleared.")

if __name__ == '__main__':
    clear_onchain_ids()
