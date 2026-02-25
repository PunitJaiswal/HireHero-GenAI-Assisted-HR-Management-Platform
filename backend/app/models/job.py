from ..database import db
from datetime import datetime

class Job(db.Model):
    __tablename__ = 'jobs'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    company = db.Column(db.String(120))
    department = db.Column(db.String(120))
    location = db.Column(db.String(120))
    type = db.Column(db.String(50))
    remote_option = db.Column(db.String(50))
    experience_level = db.Column(db.String(50))
    education = db.Column(db.String(120))
    salary = db.Column(db.String(50))
    tags = db.Column(db.String(255))  # comma-separated tags
    benefits = db.Column(db.String(255))  # comma-separated benefits
    application_deadline = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    posted_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    posted_by_user = db.relationship('User', back_populates='jobs_posted')
    applications = db.relationship('Application', back_populates='job', cascade='all, delete-orphan')