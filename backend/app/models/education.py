from ..database import db

class Education(db.Model):
    __tablename__ = 'educations'
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('profiles.id'), nullable=False)
    degree = db.Column(db.String(120), nullable=False)  # e.g., Bachelor's, Master's
    institution = db.Column(db.String(120), nullable=False)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    description = db.Column(db.Text)
    
    profile = db.relationship('Profile', back_populates='educations')