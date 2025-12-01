from indexer.models import Project

def check_project():
    try:
        projects = Project.objects.using('indexer').filter(title__contains="Milestone")
        print(f"Found {projects.count()} projects with 'Milestone' in title")
        for p in projects:
            print(f"ID: {p.project_id}, Title: {p.title}, Creator: {p.creator_address}")
    except Exception as e:
        print(f"Error: {e}")

check_project()
