import os
from flask import current_app, Blueprint, request, jsonify, g
from ..database import db
from ..models import Profile, Experience, Education, User
from ..utils import get_current_user

profile_bp = Blueprint('profile_bp', __name__)

# --- Job Seeker - Profile Endpoints ---

# GET /profiles/me
# PUT /profiles/me
@profile_bp.route('/profiles/me', methods=['GET', 'PUT'])
def profile_me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    profile = user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    if request.method == 'GET':
        return jsonify({
            'id': profile.id,
            'user_id': profile.user_id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': f"{user.first_name} {user.last_name}",
            'email': user.email,
            'role': user.role,
            'phone': profile.phone,
            'location': profile.location,
            'summary': profile.summary,
            'profile_pic': profile.profile_pic, 
            'profile_pic_url': profile.profile_pic, 
            'resume_url': profile.resume, 
            'resume': profile.resume,
            'linkedin_profile': getattr(profile, 'linkedin_profile', ''),
            'github_profile': getattr(profile, 'github_profile', ''),
            'portfolio_url': getattr(profile, 'portfolio_url', ''),
            'skills': getattr(profile, 'skills', []),
            'completeness': profile.completeness,
            'views': profile.views or 0,  # Include view count
            'experiences': [
                {
                    'id': e.id,
                    'title': e.title,
                    'company': e.company,
                    'start_date': e.start_date,
                    'end_date': e.end_date,
                    'is_current': getattr(e, 'is_current', False),
                    'description': e.description,
                    'location': getattr(e, 'location', '')
                } for e in profile.experiences
            ],
            'educations': [
                {
                    'id': e.id,
                    'degree': e.degree,
                    'institution': e.institution,
                    'start_date': e.start_date,
                    'end_date': e.end_date,
                    'description': e.description
                } for e in profile.educations
            ]
        })

    # PUT: update profile fields
    data = request.json or {}
    allowed_fields = ['phone', 'location', 'summary', 'profile_pic', 'completeness', 'linkedin_profile', 'github_profile', 'portfolio_url']

    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'company_name' in data:
        user.company_name = data['company_name']

    for field in allowed_fields:
        if field in data:
            if hasattr(profile, field):
                setattr(profile, field, data[field])

    profile.calculate_completeness()

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'completeness': profile.completeness})


# POST /profiles/me/resume
@profile_bp.route('/profiles/me/resume', methods=['POST'])
def upload_resume():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    profile = user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    if 'resume' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    filename = f"resume_{user.id}_{file.filename}"
    upload_folder = os.path.join(current_app.root_path, 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)
    profile.resume = f"/uploads/{filename}"
    profile.calculate_completeness()
    db.session.commit()
    return jsonify({'message': 'Resume uploaded successfully', 'resume_url': profile.resume, 
                    'completeness': profile.completeness})

# POST /profiles/me/avatar
@profile_bp.route('/profiles/me/avatar', methods=['POST'])
def upload_avatar():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    profile = user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    if 'profile_pic' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['profile_pic']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    filename = f"profilepic_{user.id}_{file.filename}"
    upload_folder = os.path.join(current_app.root_path, 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)
    profile.profile_pic = f"/uploads/{filename}"
    profile.calculate_completeness()
    db.session.commit()
    return jsonify({'message': 'Profile picture uploaded successfully', 'profile_pic_url': profile.profile_pic,
                    'completeness': profile.completeness})


# --- Job Seeker - Experience Endpoints ---

@profile_bp.route('/profiles/me/experiences', methods=['POST'])
def add_my_experience():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    profile = user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    data = request.json
    e = Experience(
        profile_id=profile.id,
        title=data.get('title'),
        company=data.get('company'),
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
        description=data.get('description'),
    )
    db.session.add(e)
    db.session.flush()
    profile.calculate_completeness()
    db.session.commit()
    return jsonify({'message': 'Experience added', 'id': e.id}), 201

@profile_bp.route('/profiles/me/experiences/<int:exp_id>', methods=['PUT'])
def update_my_experience(exp_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    profile = user.profile

    e = Experience.query.get_or_404(exp_id)
    if e.profile_id != profile.id:
        return jsonify({'error': 'Forbidden'}), 403

    data = request.json
    e.title = data.get('title', e.title)
    e.company = data.get('company', e.company)
    e.start_date = data.get('start_date', e.start_date)
    e.end_date = data.get('end_date', e.end_date)
    e.description = data.get('description', e.description)

    profile.calculate_completeness()
    db.session.commit()
    return jsonify({'message': 'Experience updated'})

@profile_bp.route('/profiles/me/experiences/<int:exp_id>', methods=['DELETE'])
def delete_my_experience(exp_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    profile = user.profile

    e = Experience.query.get_or_404(exp_id)
    if e.profile_id != profile.id:
        return jsonify({'error': 'Forbidden'}), 403

    db.session.delete(e)
    db.session.flush()
    profile.calculate_completeness()
    db.session.commit()
    return jsonify({'message': 'Experience deleted'})

@profile_bp.route('/profiles/me/education', methods=['POST'])
def add_education():
    user = get_current_user()
    if not user: return jsonify({'error': 'Unauthorized'}), 401
    profile = user.profile
    if not profile: return jsonify({'error': 'Profile not found'}), 404

    data = request.json
    edu = Education(
        profile_id=profile.id,
        degree=data.get('degree'),
        institution=data.get('institution'),
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
        description=data.get('description')
    )
    db.session.add(edu)
    db.session.flush()
    profile.calculate_completeness()
    db.session.commit()
    return jsonify({'message': 'Education added', 'id': edu.id}), 201

@profile_bp.route('/profiles/me/education/<int:edu_id>', methods=['DELETE'])
def delete_education(edu_id):
    user = get_current_user()
    if not user: return jsonify({'error': 'Unauthorized'}), 401
    profile = user.profile

    edu = Education.query.get_or_404(edu_id)
    if edu.profile_id != profile.id:
        return jsonify({'error': 'Forbidden'}), 403

    db.session.delete(edu)
    db.session.flush()
    profile.calculate_completeness()
    db.session.commit()
    return jsonify({'message': 'Education deleted'})


# --- HR - Profiles Endpoints ---

# GET /hr/profiles/{user_id}
@profile_bp.route('/hr/profiles/<int:user_id>', methods=['GET'])
def get_user_profile_hr(user_id):
    viewer = get_current_user()
    
    target_user = User.query.get_or_404(user_id)
    profile = target_user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    
    # Increment View Logic: If viewer exists and is NOT the owner
    if viewer and viewer.id != target_user.id:
        profile.views = (profile.views or 0) + 1
        db.session.commit()

    return jsonify({
        'id': profile.id,
        'user_id': profile.user_id,
        'first_name': target_user.first_name,
        'last_name': target_user.last_name,
        'full_name': f"{target_user.first_name} {target_user.last_name}",
        'email': target_user.email,
        'role': target_user.role,
        'phone': profile.phone,
        'location': profile.location,
        'summary': profile.summary,
        'profile_pic_url': profile.profile_pic,
        'resume_url': profile.resume,
        'completeness': profile.completeness,
        'views': profile.views,
        'experiences': [
            {
                'id': e.id,
                'title': e.title,
                'company': e.company,
                'start_date': e.start_date,
                'end_date': e.end_date,
                'description': e.description,
                'tags': []
            } for e in profile.experiences
        ]
    })

# --- Public Profile Endpoint ---
@profile_bp.route('/public/profile/<int:user_id>', methods=['GET'])
def get_public_profile(user_id):
    target_user = User.query.get_or_404(user_id)
    profile = target_user.profile
    
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    # Attempt to identify viewer to prevent self-view counting
    viewer = get_current_user() 
    
    # Increment if viewer is anonymous OR viewer is not the owner
    if not viewer or viewer.id != target_user.id:
        profile.views = (profile.views or 0) + 1
        db.session.commit()

    return jsonify({
        'first_name': target_user.first_name,
        'last_name': target_user.last_name,
        'full_name': f"{target_user.first_name} {target_user.last_name}",
        'email': target_user.email,
        'role': target_user.role,
        'location': profile.location,
        'summary': profile.summary,
        'profile_pic_url': profile.profile_pic,
        'resume_url': profile.resume,
        'linkedin_profile': getattr(profile, 'linkedin_profile', ''),
        'github_profile': getattr(profile, 'github_profile', ''),
        'portfolio_url': getattr(profile, 'portfolio_url', ''),
        'completeness': profile.completeness,
        'experiences': [
            {
                'id': e.id,
                'title': e.title,
                'company': e.company,
                'start_date': e.start_date,
                'end_date': e.end_date,
                'description': e.description,
                'is_current': getattr(e, 'is_current', False)
            } for e in profile.experiences
        ],
        'educations': [
            {
                'id': e.id,
                'degree': e.degree,
                'institution': e.institution,
                'start_date': e.start_date,
                'end_date': e.end_date,
                'description': e.description
            } for e in profile.educations
        ]
    })