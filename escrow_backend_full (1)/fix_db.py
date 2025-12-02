import psycopg2

try:
    conn = psycopg2.connect('postgresql://postgres:1234@localhost:5432/project_escrow')
    cur = conn.cursor()
    
    print("Adding columns to milestones...")
    cur.execute("ALTER TABLE milestones ADD COLUMN IF NOT EXISTS on_chain_id INTEGER")
    cur.execute("ALTER TABLE milestones ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(255)")
    cur.execute("ALTER TABLE milestones ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE") # I added this to model earlier
    
    print("Adding columns to pledges...")
    cur.execute("ALTER TABLE pledges ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(255)")
    cur.execute("ALTER TABLE pledges ADD COLUMN IF NOT EXISTS voting_power NUMERIC(38,18)")
    
    conn.commit()
    print("✅ Database schema updated successfully!")

except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
finally:
    if 'conn' in locals():
        conn.close()
