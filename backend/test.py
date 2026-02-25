import psycopg2
from psycopg2 import OperationalError

def check_postgresql_connection(uri):
    connection = None
    try:
        # Attempt to connect to the database
        connection = psycopg2.connect(uri)
        print("✅ Connection successful!")
        return True
    except OperationalError as e:
        print(f"❌ Connection failed: {e}")
        return False
    finally:
        # Ensure the connection is closed
        if connection:
            connection.close()

# Example Usage
db_uri = "postgresql://postgres:1234@localhost:5432/postgres"
check_postgresql_connection(db_uri)