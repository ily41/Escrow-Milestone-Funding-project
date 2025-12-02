import psycopg2

try:
    conn = psycopg2.connect('postgresql://postgres:1234@localhost:5432/project_escrow')
    cur = conn.cursor()
    
    tables = ['milestones', 'pledges', 'backers', 'votes']
    
    with open('schema_output.txt', 'w') as f:
        for table in tables:
            f.write(f"--- {table.capitalize()} Table ---\n")
            cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
            rows = cur.fetchall()
            if not rows:
                f.write("Table not found or empty columns.\n")
            for row in rows:
                f.write(f"{row[0]}: {row[1]}\n")
            f.write("\n")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
