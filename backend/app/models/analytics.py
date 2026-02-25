from ..database import db
from datetime import datetime

class Analytics(db.Model):
    __tablename__ = 'analytics'
    id = db.Column(db.Integer, primary_key=True)
    metric = db.Column(db.String(120), nullable=False)
    value = db.Column(db.String(120))
    date = db.Column(db.Date, default=datetime.utcnow)
