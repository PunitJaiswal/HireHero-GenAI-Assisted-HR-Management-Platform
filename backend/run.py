from app.main import app
import sys

if __name__ == '__main__':
    if "--seed" in sys.argv:
        print("--- Seed argument detected. Resetting and seeding database... ---")
        with app.app_context():
            from app.seed_data import seed_database
            seed_database()
            print("--- Database seeded successfully. Starting Server... ---")
    app.run(port=5000)
