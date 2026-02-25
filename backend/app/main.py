from app import create_app
from app.database import db
from app.config import Config
from flask import Flask
import os

app = create_app()

# Initialize Database and Seed Data on Startup
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)