from ..database import db
from datetime import datetime

class Interview(db.Model):
    __tablename__ = 'interviews'
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    stage = db.Column(db.String(50), nullable=False) # e.g., 'screening', 'technical'
    scheduled_at = db.Column(db.DateTime, nullable=False)
    location_type = db.Column(db.String(50)) # 'video', 'phone', 'in_person'
    location_detail = db.Column(db.String(255)) # Meeting link or address
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    application = db.relationship('Application', backref=db.backref('interviews', lazy=True, cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            'id': self.id,
            'application_id': self.application_id,
            'stage': self.stage,
            'scheduled_at': self.scheduled_at.isoformat(),
            'location_type': self.location_type,
            'location_detail': self.location_detail
        }