from flask import Flask, jsonify, send_from_directory
from .config import Config
import uuid
import os
from .database import db

# Import Blueprints
from .routes.auth_routes import auth_bp, init_oauth
from .routes.genai_routes import genai_bp
from .routes.job_routes import job_bp
from .routes.application_routes import application_bp
from .routes.profile_routes import profile_bp
from .routes.employee_routes import employee_bp
from .routes.analytics_routes import analytics_bp
from .routes.utility_routes import utility_bp
from .routes.interview_routes import interview_bp
from .routes.timeline_routes import timeline_bp
from .routes.matching_routes import matching_bp

from .models import User, Job, Profile, Experience, Application, Employee, Performance, Analytics, ChatMessage

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # This ID changes every time you restart the backend, used for clearing client localStorage
    app.config['SERVER_INSTANCE_ID'] = str(uuid.uuid4())

    # Init DB
    db.init_app(app)

    with app.app_context():
        db.create_all()

    # Register Blueprints
    # Note: url_prefix='/api' is common. Some routes might define their own paths if needed,
    # but based on my files, most assume /api prefix is stripped or added here.
    # Looking at my route definitions:
    # @job_bp.route('/jobs') -> /api/jobs
    # @genai_bp.route('/gen-ai/chat') -> /api/gen-ai/chat

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(genai_bp, url_prefix='/api')
    app.register_blueprint(job_bp, url_prefix='/api')
    app.register_blueprint(application_bp, url_prefix='/api')
    app.register_blueprint(profile_bp, url_prefix='/api')
    app.register_blueprint(employee_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api')
    app.register_blueprint(utility_bp, url_prefix='/api')
    app.register_blueprint(interview_bp, url_prefix='/api')
    app.register_blueprint(timeline_bp, url_prefix='/api')
    app.register_blueprint(matching_bp, url_prefix='/api')

    # Initialize OAuth
    init_oauth(app)

    return app
