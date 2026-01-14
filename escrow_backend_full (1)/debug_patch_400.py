
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_core.settings')
django.setup()

from indexer.models import Project
from api.serializers import ProjectSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

try:
    project = Project.objects.using('indexer').first()
    if not project:
        print("No projects found.")
        exit(0)
        
    print(f"Testing PATCH for project: {project.project_id}")
    
    data = {
        "on_chain_id": 1,
        "created_tx_hash": "0x123",
        "escrow_address": "0x456"
    }
    
    serializer = ProjectSerializer(project, data=data, partial=True)
    if serializer.is_valid():
        print("Serializer is valid!")
    else:
        print("Serializer invalid. Errors:")
        print(json.dumps(serializer.errors, indent=2))
        
except Exception as e:
    import traceback
    traceback.print_exc()
