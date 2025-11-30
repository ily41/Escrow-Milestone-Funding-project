import requests
import json

base_url = "http://localhost:8000"
username = "testcreator"
password = "testcreator"
project_id = "7d38f4fc-2d6c-46e7-ad36-024c1875e4c6"

# Login
auth_resp = requests.post(f"{base_url}/auth/login/", json={"username": username, "password": password})
if auth_resp.status_code != 200:
    print(f"Login failed: {auth_resp.text}")
    exit(1)

token = auth_resp.json()["access"]
headers = {"Authorization": f"Bearer {token}"}

# Create Milestone
milestone_data = {
    "title": "API Test Milestone",
    "description": "Created via python script",
    "percentage": 15
}
create_resp = requests.post(
    f"{base_url}/api/projects/{project_id}/milestones/create/",
    json=milestone_data,
    headers=headers
)

print(f"Create status: {create_resp.status_code}")
print(f"Create response: {create_resp.text}")
