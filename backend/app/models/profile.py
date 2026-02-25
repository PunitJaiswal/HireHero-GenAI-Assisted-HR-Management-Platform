from ..database import db

class Profile(db.Model):
    __tablename__ = 'profiles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    phone = db.Column(db.String(20))
    location = db.Column(db.String(120))
    summary = db.Column(db.Text)
    profile_pic = db.Column(db.String(255))
    resume = db.Column(db.String(255))  # Path to uploaded resume file
    views = db.Column(db.Integer, default=0)
    completeness = db.Column(db.Integer, default=0)
    user = db.relationship('User', back_populates='profile')
    experiences = db.relationship('Experience', back_populates='profile', cascade='all, delete-orphan')
    educations = db.relationship('Education', back_populates='profile', cascade='all, delete-orphan')

    def calculate_completeness(self):
        score = 0
        if self.phone: score += 10
        if self.location: score += 10
        if self.summary: score += 10
        if self.profile_pic: score += 10
        if self.resume: score += 20
        if self.experiences: score += 20
        # Check if educations relationship exists and has items
        if hasattr(self, 'educations') and self.educations: score += 20
        
        self.completeness = score
        return score
