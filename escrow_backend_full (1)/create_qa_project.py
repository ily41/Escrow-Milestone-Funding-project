import os
import django
import uuid
from datetime import datetime, timedelta, timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_core.settings')
django.setup()

from indexer.models import Project
from accounts.models import WalletProfile
from django.contrib.auth.models import User

def create_project():
    # Get or create creator
    u, created = User.objects.get_or_create(username='creator_qa_2')
    if created:
        u.set_password('Password123!')
        u.save()
        print("Created user creator_qa_2")
    
    p, _ = WalletProfile.objects.get_or_create(user=u, defaults={'wallet_address': '0xCreatorQA2', 'role': 'creator'})
    if not p.wallet_address:
        p.wallet_address = '0xCreatorQA2'
        p.role = 'creator'
        p.save()
        print("Updated wallet profile")

    # Create Project
    project_id = str(uuid.uuid4())
    Project.objects.using('indexer').create(
        project_id=project_id,
        title="QA Project 1000 ETH",
        escrow_address="0x0000000000000000000000000000000000000000",
        creator_address=p.wallet_address,
        funding_goal=1000,
        deadline=datetime.now(timezone.utc) + timedelta(days=30),
        status='active'
    )
    print(f"Created project {project_id}")

if __name__ == '__main__':
    create_project()
