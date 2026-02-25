from ..database import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    company_name = db.Column(db.String(120))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(50), nullable=False, default='candidate')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Relationships
    profile = db.relationship('Profile', uselist=False, back_populates='user', cascade='all, delete-orphan')
    applications = db.relationship('Application', back_populates='user', cascade='all, delete-orphan')
    employee = db.relationship('Employee', uselist=False, back_populates='user', cascade='all, delete-orphan')
    chat_messages = db.relationship('ChatMessage', back_populates='user', cascade='all, delete-orphan')
    jobs_posted = db.relationship('Job', back_populates='posted_by_user', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'company_name': self.company_name,
            'role': self.role
        }