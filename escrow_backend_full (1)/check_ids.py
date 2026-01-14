import os
import django
import sys

# Add the project root to key path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_core.settings')
django.setup()

from indexer.models import Project

def check_on_chain_ids():
    projects = Project.objects.exclude(on_chain_id__isnull=True).values('project_id', 'title', 'on_chain_id')
    print("Existing projects with on_chain_id:")
    for p in projects:
        print(f"ID: {p['on_chain_id']} - Title: {p['title']} ({p['project_id']})")
    
    # Check specifically for 3
    if Project.objects.filter(on_chain_id=3).exists():
        print("\n[WARNING] Project with on_chain_id=3 ALREADY EXISTS!")
    else:
        print("\n[INFO] on_chain_id=3 is available.")

if __name__ == "__main__":
    check_on_chain_ids()
