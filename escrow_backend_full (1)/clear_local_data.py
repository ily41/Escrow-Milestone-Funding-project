import os
import django
import sys

# Add the project root to key path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_core.settings')
django.setup()

from indexer.models import Project, Milestone, Pledge, Release, Refund, AuditLog, Vote, Backer

def clear_data():
    print("Clearing all data from Indexer DB...")
    
    # Delete in order of dependencies (leaves last)
    Refund.objects.using('indexer').all().delete()
    Release.objects.using('indexer').all().delete()
    Vote.objects.using('indexer').all().delete()
    Pledge.objects.using('indexer').all().delete()
    Milestone.objects.using('indexer').all().delete()
    Project.objects.using('indexer').all().delete()
    Backer.objects.using('indexer').all().delete()
    AuditLog.objects.using('indexer').all().delete()
    
    print("All indexer data cleared.")

if __name__ == "__main__":
    clear_data()
