from indexer.models import Project, Milestone

def add_milestone():
    try:
        with open("project_id.txt", "r") as f:
            project_id = f.read().strip()
            
        print(f"Project ID: {project_id}")
        project = Project.objects.using('indexer').get(project_id=project_id)
        
        m = Milestone.objects.using('indexer').create(
            project=project,
            title="Phase 1",
            description="First phase",
            required_amount=500,
            status="pending"
        )
        print(f"Created Milestone ID: {m.id}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

add_milestone()
