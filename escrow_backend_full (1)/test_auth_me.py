import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth_me():
    # Login
    login_url = f"{BASE_URL}/auth/login/"
    creds = {
        "username": "creator_qa_2",
        "password": "Password123!"
    }
    try:
        response = requests.post(login_url, json=creds)
        token = response.json().get("access")
        
        # Get Me
        me_url = f"{BASE_URL}/auth/me/"
        headers = {"Authorization": f"Bearer {token}"}
        me_resp = requests.get(me_url, headers=headers)
        
        print(f"Me Response: {me_resp.status_code}")
        print(json.dumps(me_resp.json(), indent=2))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_auth_me()
