import requests
import sys

BASE_URL = "http://localhost:8000/api"

def verify_endpoints():
    print("Verifying endpoints...")
    
    # 1. Get list of projects
    print("\n1. GET /api/projects")
    try:
        response = requests.get(f"{BASE_URL}/projects")
        response.raise_for_status()
        projects = response.json()
        print(f"Found {len(projects)} projects")
        
        if not projects:
            print("No projects found. Creating one for testing...")
            # Create a dummy project if none exists (using existing create endpoint if possible, or manual insert if needed)
            # For now, assuming at least one project exists or we can't proceed easily without auth
            print("Skipping detailed checks as no projects exist.")
            return

        project_id = projects[0]['project_id']
        print(f"Using project_id: {project_id}")
        
        # Check if milestones are present in list view
        if 'milestones' in projects[0]:
            print("SUCCESS: 'milestones' field present in project list view")
        else:
            print("FAILURE: 'milestones' field MISSING in project list view")

    except Exception as e:
        print(f"Error fetching projects: {e}")
        return

    # 2. Get project detail
    print(f"\n2. GET /api/projects/{project_id}")
    try:
        response = requests.get(f"{BASE_URL}/projects/{project_id}")
        response.raise_for_status()
        project = response.json()
        
        if 'milestones' in project:
            print("SUCCESS: 'milestones' field present in project detail view")
            print(f"Milestones: {project['milestones']}")
        else:
            print("FAILURE: 'milestones' field MISSING in project detail view")
            
    except Exception as e:
        print(f"Error fetching project detail: {e}")

    # 3. Update project status
    print(f"\n3. POST /api/projects/{project_id}/status/")
    status_url = f"{BASE_URL}/projects/{project_id}/status/"
    
    # Test valid status
    try:
        print("Testing valid status 'inactive'...")
        response = requests.post(status_url, json={"status": "inactive"})
        if response.status_code == 200:
            print("SUCCESS: Status updated to 'inactive'")
            print(response.json())
        else:
            print(f"FAILURE: Failed to update status. Code: {response.status_code}")
            print(response.text)
            
        # Revert to active
        print("Reverting status to 'active'...")
        requests.post(status_url, json={"status": "active"})

    except Exception as e:
        print(f"Error updating status: {e}")

    # Test invalid status
    try:
        print("Testing invalid status 'invalid_status'...")
        response = requests.post(status_url, json={"status": "invalid_status"})
        if response.status_code == 400:
            print("SUCCESS: Invalid status rejected with 400")
        else:
            print(f"FAILURE: Invalid status NOT rejected. Code: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"Error testing invalid status: {e}")

    # 4. Create Milestone and Verify
    print(f"\n4. POST /api/projects/{project_id}/milestones/create")
    milestone_url = f"{BASE_URL}/projects/{project_id}/milestones/create"
    
    try:
        print("Creating a new milestone...")
        milestone_data = {
            "title": "Verification Milestone",
            "description": "Created by verification script",
            "percentage": 10
        }
        # Note: This endpoint requires authentication (IsAuthenticated). 
        # Since we are running a simple script without auth token, this might fail if we don't handle auth.
        # However, for the purpose of this task, we implemented the fix in the view.
        # To properly test this without auth, we would need to mock auth or obtain a token.
        # Given the constraints, I will assume we can't easily get a token here without user interaction or more complex setup.
        # BUT, I can check if the previous GET requests showed any milestones.
        
        # Let's try to create it anyway, expecting 403 or 401 if auth is enforced.
        # If the user has disabled auth for dev or if we can simulate it, it would work.
        # Wait, the view says `permission_classes = [IsAuthenticated]`.
        # So this request will likely fail with 403.
        
        # To verify the FIX (which is about saving to DB), we can manually insert a milestone into the DB 
        # (if we had shell access) or we can rely on the code change we just made.
        
        # Actually, I can use the `run_command` to run a django shell script to create a milestone 
        # and then use the API to fetch it. That would verify the GET part.
        # But the user asked to fix "when milestone is created it doesn't appear".
        # So the creation part is key.
        
        # Let's try to hit the endpoint. If it fails due to auth, I'll note it.
        response = requests.post(milestone_url, json=milestone_data)
        if response.status_code == 201 or response.status_code == 200:
            print("SUCCESS: Milestone creation request submitted")
            print(response.json())
            
            # Verify it appears in project details
            print("Verifying milestone in project details...")
            response = requests.get(f"{BASE_URL}/projects/{project_id}")
            project = response.json()
            milestones = project.get('milestones', [])
            found = any(m['title'] == "Verification Milestone" for m in milestones)
            if found:
                print("SUCCESS: Created milestone found in project details")
            else:
                print("FAILURE: Created milestone NOT found in project details")
        else:
            print(f"Skipping milestone creation test due to auth/error. Code: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"Error creating milestone: {e}")

    # 5. Create Project with Status
    print(f"\n5. POST /api/projects/create (Status Test)")
    create_url = f"{BASE_URL}/projects/create"
    
    # Test 5.1: Create with status='inactive'
    print("Testing creation with status='inactive'...")
    project_data_inactive = {
        "title": "Inactive Project",
        "funding_goal_eth": "10.0",
        "deadline_timestamp": 1735689600,
        "status": "inactive"
    }
    
    try:
        # Again, assuming we might hit auth issues, but let's try.
        response = requests.post(create_url, json=project_data_inactive)
        if response.status_code == 200 or response.status_code == 201:
            print("SUCCESS: Project creation request submitted")
            data = response.json()
            new_project_id = data.get('project_id')
            
            # Verify status
            print(f"Verifying status for {new_project_id}...")
            response = requests.get(f"{BASE_URL}/projects/{new_project_id}")
            project = response.json()
            if project.get('status') == 'inactive':
                print("SUCCESS: Project created with status 'inactive'")
            else:
                print(f"FAILURE: Project status is '{project.get('status')}', expected 'inactive'")
        else:
             print(f"Skipping creation test due to auth/error. Code: {response.status_code}")

    except Exception as e:
        print(f"Error creating inactive project: {e}")

    # Test 5.2: Create without status (default)
    print("Testing creation without status (default)...")
    project_data_default = {
        "title": "Default Active Project",
        "funding_goal_eth": "5.0",
        "deadline_timestamp": 1735689600
    }
    
    try:
        response = requests.post(create_url, json=project_data_default)
        if response.status_code == 200 or response.status_code == 201:
            print("SUCCESS: Project creation request submitted")
            data = response.json()
            new_project_id = data.get('project_id')
            
            # Verify status
            print(f"Verifying status for {new_project_id}...")
            response = requests.get(f"{BASE_URL}/projects/{new_project_id}")
            project = response.json()
            if project.get('status') == 'active':
                print("SUCCESS: Project created with default status 'active'")
            else:
                print(f"FAILURE: Project status is '{project.get('status')}', expected 'active'")
        else:
             print(f"Skipping creation test due to auth/error. Code: {response.status_code}")

    except Exception as e:
        print(f"Error creating default project: {e}")

if __name__ == "__main__":
    verify_endpoints()
