import requests
import json

BASE_URL = "http://localhost:8000"

def add_milestone():
    # 1. Login
    login_url = f"{BASE_URL}/auth/login/"
    creds = {
        "username": "creator_qa_2",
        "password": "Password123!"
    }
    try:
        response = requests.post(login_url, json=creds)
        token = response.json().get("access")
        
        # 2. Get Project ID
        with open("project_id.txt", "r") as f:
            project_id = f.read().strip()
            
        print(f"Adding milestone to project: {project_id}")
        
        # 3. Create Milestone
        url = f"{BASE_URL}/api/projects/{project_id}/milestones/create/"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "title": "Phase 1",
            "description": "First phase",
            "required_amount": 500
        }
        
        response = requests.post(url, headers=headers, json=payload)
        print(f"Create Response: {response.status_code}")
        print(response.text)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_milestone()
