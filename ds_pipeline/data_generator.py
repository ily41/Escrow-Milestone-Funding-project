import pandas as pd
import numpy as np
from faker import Faker
import uuid
import random
from datetime import datetime, timedelta
import os

# Initialize Faker
fake = Faker()
Faker.seed(42)
np.random.seed(42)
# Configuration
NUM_CREATORS = 50
NUM_BACKERS = 500
NUM_PROJECTS = 200
AVG_PLEDGES_PER_PROJECT = 5
AVG_MILESTONES_PER_PROJECT = 4

def generate_uuid():
    return str(uuid.uuid4())

def generate_data():
    print("Generating data...")
    
    # --- 1. Creators ---
    print("Generating Creators...")
    creators = []
    for _ in range(NUM_CREATORS):
        creators.append({
            'creator_id': generate_uuid(),
            'wallet_address': f"0x{fake.sha256()[:40]}",
            'name': fake.name(),
            'email': fake.email(),
            'reputation_score': round(random.uniform(0, 10), 2),
            'registered_at': fake.date_time_between(start_date='-2y', end_date='-1y'),
            'status': 1
        })
    df_creators = pd.DataFrame(creators)
    
    # --- 2. Backers ---
    print("Generating Backers...")
    backers = []
    for _ in range(NUM_BACKERS):
        backers.append({
            'backer_id': generate_uuid(),
            'wallet_address': f"0x{fake.sha256()[:40]}",
            'name': fake.name(),
            'email': fake.email(),
            'total_pledged': 0.0, # Will update later
            'registered_at': fake.date_time_between(start_date='-2y', end_date='-1y'),
            'status': 1
        })
    df_backers = pd.DataFrame(backers)

    # --- 3. Projects ---
    print("Generating Projects...")
    projects = []
    for _ in range(NUM_PROJECTS):
        creator = random.choice(creators)
        created_at = fake.date_time_between(start_date='-1y', end_date='now')
        deadline = created_at + timedelta(days=random.randint(30, 90))
        
        projects.append({
            'project_id': generate_uuid(),
            'creator_id': creator['creator_id'],
            'escrow_address': f"0x{fake.sha256()[:40]}",
            'title': fake.catch_phrase(),
            'description': fake.text(max_nb_chars=200),
            'funding_goal': round(np.random.lognormal(mean=10, sigma=1), 2), # ~$22k avg
            'current_funding': 0.0, # Will update later
            'deadline': deadline,
            'created_at': created_at,
            'status': 1 # Default active, will update based on funding
        })
    df_projects = pd.DataFrame(projects)

    # --- 4. Pledges ---
    print("Generating Pledges...")
    pledges = []
    
    # Helper to track project funding and backer spending
    project_funding = {p['project_id']: 0.0 for p in projects}
    backer_spending = {b['backer_id']: 0.0 for b in backers}

    for project in projects:
        # Random number of pledges for this project
        num_pledges = int(np.random.poisson(AVG_PLEDGES_PER_PROJECT))
        if num_pledges == 0: continue
        
        project_backers = random.sample(backers, k=min(num_pledges, len(backers)))
        
        for backer in project_backers:
            # Pledge amount relative to goal (e.g., 1% to 50%)
            amount = round(project['funding_goal'] * random.uniform(0.01, 0.5), 2)
            pledged_at = fake.date_time_between(start_date=project['created_at'], end_date=project['deadline'])
            
            pledges.append({
                'pledge_id': generate_uuid(),
                'project_id': project['project_id'],
                'backer_id': backer['backer_id'],
                'amount': amount,
                'pledged_at': pledged_at,
                'status': 1,
                'voting_power': amount # Simplified: 1 token = 1 currency unit
            })
            
            project_funding[project['project_id']] += amount
            backer_spending[backer['backer_id']] += amount

    df_pledges = pd.DataFrame(pledges)

    # Update Projects current_funding and status
    for idx, row in df_projects.iterrows():
        pid = row['project_id']
        funded = project_funding.get(pid, 0.0)
        df_projects.at[idx, 'current_funding'] = funded
        
        # Status logic: 2=Funded if met goal, 3=Failed if deadline passed & not met (simplified)
        if funded >= row['funding_goal']:
            df_projects.at[idx, 'status'] = 2 # Funded
        elif row['deadline'] < datetime.now():
            df_projects.at[idx, 'status'] = 3 # Failed
            
    # Update Backers total_pledged
    for idx, row in df_backers.iterrows():
        bid = row['backer_id']
        df_backers.at[idx, 'total_pledged'] = backer_spending.get(bid, 0.0)

    # --- 5. Milestones ---
    print("Generating Milestones...")
    milestones = []
    votes = []
    
    for project in projects:
        # Only generate milestones for funded or active projects
        if project_funding[project['project_id']] == 0: continue

        num_milestones = random.randint(3, 5)
        total_funding = project_funding[project['project_id']]
        amount_per_milestone = total_funding / num_milestones
        
        for i in range(num_milestones):
            ms_id = generate_uuid()
            due_date = project['deadline'] + timedelta(days=(i+1)*30)
            
            milestones.append({
                'milestone_id': ms_id,
                'project_id': project['project_id'],
                'title': f"Milestone {i+1}",
                'description': fake.sentence(),
                'funding_amount': round(amount_per_milestone, 2),
                'due_date': due_date,
                'submitted_at': None, # To be filled if completed
                'status': 0, # Pending
                'voting_session_id': generate_uuid()
            })
            
            # Simulate Voting (if project is funded)
            if df_projects.loc[df_projects['project_id'] == project['project_id'], 'status'].values[0] == 2:
                # Get backers for this project
                project_pledges = df_pledges[df_pledges['project_id'] == project['project_id']]
                
                for _, pledge in project_pledges.iterrows():
                    # Random vote: 1 (Approve) or 0 (Reject)
                    # Higher probability of approval
                    approval = 1 if random.random() > 0.1 else 0
                    
                    votes.append({
                        'vote_id': generate_uuid(),
                        'milestone_id': ms_id,
                        'backer_id': pledge['backer_id'],
                        'vote_weight': pledge['amount'],
                        'approval': approval,
                        'voted_at': due_date + timedelta(days=random.randint(1, 5))
                    })

    df_milestones = pd.DataFrame(milestones)
    df_votes = pd.DataFrame(votes)

    # --- Save to CSV ---
    output_dir = "ds_pipeline/data"
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Saving data to {output_dir}...")
    df_creators.to_csv(f"{output_dir}/creators.csv", index=False)
    df_backers.to_csv(f"{output_dir}/backers.csv", index=False)
    df_projects.to_csv(f"{output_dir}/projects.csv", index=False)
    df_pledges.to_csv(f"{output_dir}/pledges.csv", index=False)
    df_milestones.to_csv(f"{output_dir}/milestones.csv", index=False)
    df_votes.to_csv(f"{output_dir}/votes.csv", index=False)
    
    print("Data generation complete!")
    print(f"Projects: {len(df_projects)}")
    print(f"Pledges: {len(df_pledges)}")
    print(f"Milestones: {len(df_milestones)}")
    print(f"Votes: {len(df_votes)}")

if __name__ == "__main__":
    generate_data()
