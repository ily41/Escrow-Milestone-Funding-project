import requests
import json

BASE_URL = "http://localhost:8000"
PROJECT_ID = "fb95b108-3604-4bfb-8a93-90d58611b35b"

def test_project_detail():
    url = f"{BASE_URL}/api/projects/{PROJECT_ID}/"
    try:
        response = requests.get(url)
        print(f"Project Response: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_project_detail()
