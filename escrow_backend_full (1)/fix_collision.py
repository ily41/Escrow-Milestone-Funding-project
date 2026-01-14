import os
import django
import sys

# Add the project root to key path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_core.settings')
django.setup()

from indexer.models import Project

def fix_collision():
    target_id = 4
    
    # Find conflicting project
    conflict = Project.objects.filter(on_chain_id=target_id).first()
    
    if conflict:
        print(f"Found conflicting project: {conflict.title} (ID: {conflict.project_id})")
        print("Clearing its on_chain_id to allow reuse...")
        conflict.on_chain_id = None
        conflict.save()
        print("Done. on_chain_id 3 is now available.")
    else:
        print(f"No project found with on_chain_id={target_id}")

if __name__ == "__main__":
    fix_collision()
