from flask import Blueprint, jsonify, send_from_directory, current_app
import os

utility_bp = Blueprint('utility_bp', __name__)

@utility_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

@utility_bp.route('/system/status', methods=['GET'])
def get_system_status():
    """Returns the current server instance ID."""
    return jsonify({
        'status': 'online',
        'instance_id': current_app.config.get('SERVER_INSTANCE_ID')
    })

def get_upload_folder():
    """Returns the upload folder path. Uses /tmp on serverless (Vercel), local uploads/ otherwise."""
    if os.environ.get('VERCEL') or not os.access(os.path.join(current_app.root_path, 'uploads'), os.W_OK):
        folder = '/tmp/hirehero_uploads'
    else:
        folder = os.path.join(current_app.root_path, 'uploads')
    os.makedirs(folder, exist_ok=True)
    return folder

@utility_bp.route('/uploads/<path:filename>', methods=['GET'])
def get_uploaded_file(filename):
    upload_folder = get_upload_folder()
    return send_from_directory(upload_folder, filename)

@utility_bp.route('/departments', methods=['GET'])
def get_departments():
    departments = [
        "Software Engineering",
        "Data Science",
        "Healthcare",
        "Pharmacy",
        "Digital Marketing",
        "Public Relations",
        "Legal",
        "Corporate Compliance",
        "Finance",
        "Accounting"
    ]
    return jsonify(departments)
