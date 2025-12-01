from indexer.models import Project

def check_project():
    try:
        projects = Project.objects.using('indexer').filter(title__contains="Milestone")
        with open("project_id.txt", "w") as f:
            for p in projects:
                f.write(str(p.project_id))
                break # Just take the first one
    except Exception as e:
        print(f"Error: {e}")

check_project()
