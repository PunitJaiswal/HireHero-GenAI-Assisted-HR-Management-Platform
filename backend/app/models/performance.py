from ..database import db
from datetime import datetime

class Performance(db.Model):
    __tablename__ = 'performances'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    rating = db.Column(db.Float, default=0.0) # 1.0 to 5.0
    comments = db.Column(db.Text)
    date = db.Column(db.Date, default=datetime.utcnow)
    employee = db.relationship('Employee', back_populates='performances')