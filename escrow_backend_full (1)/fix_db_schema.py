import sqlite3

# Connect to the database
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Check if milestones table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='milestones'")
result = cursor.fetchone()

if result:
    print("✓ 'milestones' table exists")
    print("\nCurrent columns:")
    cursor.execute("PRAGMA table_info(milestones)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
    
    # Check if is_activated exists
    has_is_activated = any(col[1] == 'is_activated' for col in columns)
    
    if not has_is_activated:
        print("\n✗ Column 'is_activated' is missing. Adding it now...")
        try:
            cursor.execute('ALTER TABLE milestones ADD COLUMN is_activated BOOLEAN DEFAULT 0')
            conn.commit()
            print("✓ Successfully added 'is_activated' column")
        except sqlite3.OperationalError as e:
            print(f"✗ Error adding column: {e}")
    else:
        print("\n✓ Column 'is_activated' already exists")
    
    # Check if on_chain_id exists
    has_on_chain_id = any(col[1] == 'on_chain_id' for col in columns)
    
    if not has_on_chain_id:
        print("\n✗ Column 'on_chain_id' is missing. Adding it now...")
        try:
            cursor.execute('ALTER TABLE milestones ADD COLUMN on_chain_id INTEGER')
            conn.commit()
            print("✓ Successfully added 'on_chain_id' column")
        except sqlite3.OperationalError as e:
            print(f"✗ Error adding column: {e}")
    else:
        print("\n✓ Column 'on_chain_id' already exists")
        
else:
    print("✗ 'milestones' table does not exist!")
    print("\nAvailable tables:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    for table in cursor.fetchall():
        print(f"  - {table[0]}")

conn.close()
