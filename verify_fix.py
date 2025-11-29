import requests
import uuid
import time

BASE_URL = "http://localhost:8000"

def run_verification():
    # 1. Register
    username = f"user_{uuid.uuid4().hex[:8]}"
    password = "password123"
    email = f"{username}@example.com"
    
    print(f"Registering user: {username}")
    try:
        resp = requests.post(f"{BASE_URL}/auth/register/", json={
            "username": username,
            "email": email,
            "password": password,
            "role": "creator"
        })
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to server. Is it running on localhost:8000?")
        return

    if resp.status_code != 201:
        print(f"Registration failed: {resp.text}")
        # If user already exists, try to login (though random username makes this unlikely)
        return

    # 2. Login
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": username,
        "password": password
    })
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    
    tokens = resp.json()
    access_token = tokens['access']
    headers = {"Authorization": f"Bearer {access_token}"}

    # 3. Link Wallet
    print("Linking wallet...")
    resp = requests.post(f"{BASE_URL}/auth/wallet/link/", json={
        "wallet_address": "0x1234567890123456789012345678901234567890"
    }, headers=headers)
    if resp.status_code != 200:
        print(f"Wallet linking failed: {resp.text}")
        return

    # 4. Create Project
    print("Creating project...")
    project_title = f"Test Project {uuid.uuid4().hex[:4]}"
    resp = requests.post(f"{BASE_URL}/api/projects/create", json={
        "title": project_title,
        "description": "Verification project",
        "funding_goal_eth": "1.0",
        "deadline_timestamp": int(time.time()) + 3600
    }, headers=headers)
    
    if resp.status_code != 200:
        print(f"Project creation failed: {resp.text}")
        return
    
    print(f"Project created: {resp.json()}")

    # 5. List Projects
    print("Listing projects...")
    resp = requests.get(f"{BASE_URL}/api/projects", headers=headers)
    if resp.status_code != 200:
        print(f"List projects failed: {resp.text}")
        return
    
    projects = resp.json()
    # Check if pagination is used (Django Rest Framework default might be paginated)
    if isinstance(projects, dict) and 'results' in projects:
        projects = projects['results']
        
    found = False
    for p in projects:
        if p['title'] == project_title:
            found = True
            print("SUCCESS: Created project found in list!")
            break
    
    if not found:
        print("FAILURE: Created project NOT found in list.")
        print("Projects found:", [p['title'] for p in projects])

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"An error occurred: {e}")
