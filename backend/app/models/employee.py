from ..database import db
from datetime import datetime

class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    hired_by = db.Column(db.Integer)
    job_title = db.Column(db.String(120))
    department = db.Column(db.String(120))
    job_location = db.Column(db.String(50))
    employment_type = db.Column(db.String(50))
    salary = db.Column(db.String(50))
    hired_at = db.Column(db.DateTime, default=datetime.utcnow)
    photo = db.Column(db.String(255))
    user = db.relationship('User', back_populates='employee')
    performances = db.relationship('Performance', back_populates='employee', cascade='all, delete-orphan')
