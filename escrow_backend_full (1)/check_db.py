import sqlite3

# Connect to the database
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# List all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables in database:")
for table in tables:
    print(f"  - {table[0]}")

# Check milestones table structure
print("\nChecking 'milestones' table columns:")
try:
    cursor.execute("PRAGMA table_info(milestones)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
except sqlite3.OperationalError as e:
    print(f"  Error: {e}")

conn.close()
