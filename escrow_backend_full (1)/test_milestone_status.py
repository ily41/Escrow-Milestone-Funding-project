import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_core.settings')
django.setup()

from indexer.models import Project, Milestone
import uuid

# Get the test project
project_id = 'c8e887e7-bc89-4501-ab3c-98aa9d662346'

try:
    project = Project.objects.using('indexer').get(project_id=project_id)
    print(f"Found project: {project.title}")
    
    # Try to create a milestone with integer status
    milestone = Milestone.objects.using('indexer').create(
        project=project,
        title='Test Milestone - Integer Status',
        description='Testing that integer status works',
        required_amount=5.0,
        status=0  # 0 = Pending
    )
    
    print(f"\n✅ SUCCESS! Milestone created with ID: {milestone.milestone_id}")
    print(f"   Title: {milestone.title}")
    print(f"   Status: {milestone.status} (should be 0 for Pending)")
    print(f"   Required Amount: {milestone.required_amount}")
    
    # Verify it was saved correctly
    saved_milestone = Milestone.objects.using('indexer').get(milestone_id=milestone.milestone_id)
    print(f"\n✅ Verified milestone in database:")
    print(f"   Status type: {type(saved_milestone.status)}")
    print(f"   Status value: {saved_milestone.status}")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
