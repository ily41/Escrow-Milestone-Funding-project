import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_create_project():
    # 1. Login
    login_url = f"{BASE_URL}/auth/login/"
    creds = {
        "username": "creator_qa_2",
        "password": "Password123!"
    }
    try:
        response = requests.post(login_url, json=creds)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} {response.text}")
            return
        
        token = response.json().get("access")
        print(f"Got token: {token[:10]}...")
        
        # 2. Create Project
        create_url = f"{BASE_URL}/api/projects/create/"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Calculate timestamp for 2026-01-01
        # 1767225600 is roughly 2026-01-01
        payload = {
            "title": "Milestone Test Project API",
            "description": "Test Description API",
            "funding_goal_eth": 1000,
            "deadline_timestamp": 1767225600,
            "status": "active"
        }
        
        print(f"Sending payload: {json.dumps(payload, indent=2)}")
        response = requests.post(create_url, headers=headers, json=payload)
        
        print(f"Create response: {response.status_code}")
        print(f"Body: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_create_project()
