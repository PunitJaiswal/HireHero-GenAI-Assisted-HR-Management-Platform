from flask import Blueprint, request, jsonify
from ..database import db
from ..models import Job
from ..utils import get_current_user
from ..services.matching_service import matching_service
import json

job_bp = Blueprint('job_bp', __name__)

# --- Job Seeker - Jobs Endpoints ---

@job_bp.route('/jobs', methods=['GET'])
def get_jobs():
    # Helper for pagination
    page = request.args.get('page', 1, type=int)
    limit_param = request.args.get('limit', type=int)

    jobs = Job.query.all() 

    if limit_param:
        limit = limit_param
        start = (page - 1) * limit
        end = start + limit
        paginated_jobs = jobs[start:end]
        total_pages = (len(jobs) + limit - 1) // limit
    else:
        # Show all jobs if no limit provided
        paginated_jobs = jobs
        limit = len(jobs)
        total_pages = 1

    # Check for authenticated user to calculate match score
    user = get_current_user()
    profile = user.profile if user else None

    job_list = []
    for job in paginated_jobs:
        job_data = {
            'id': job.id,
            'title': job.title,
            'company': job.company,
            'department': job.department,
            'description': job.description,
            'location': job.location,
            'type': job.type,
            'remote_option': job.remote_option,
            'salary': job.salary, 
            'experience_level': job.experience_level,
            'education': job.education,
            'benefits': job.benefits,
            'application_deadline': job.application_deadline,
            'tags': job.tags.split(',') if job.tags else [],
            'created_at': job.created_at,
            'company_logo_url': getattr(job, 'company_logo_url', ''),
            'applications_count': len(job.applications)
        }

        # Calculate AI Match Score if user profile exists
        if profile:
            try:
                score = matching_service.calculate_score(profile, job)
                job_data['match_score'] = score
            except Exception as e:
                print(f"Error calculating score for job {job.id}: {e}")
                job_data['match_score'] = 0

        job_list.append(job_data)

    # Sort by match score if user is logged in
    if profile:
        job_list.sort(key=lambda x: x.get('match_score', 0), reverse=True)

    return jsonify({
        'pagination': {
            'page': page,
            'per_page': limit if limit else len(jobs),
            'total_items': len(jobs),
            'total_pages': total_pages
        },
        'jobs': job_list
    })

@job_bp.route('/jobs/search', methods=['GET'])
def search_jobs():
    q = request.args.get('q', '').lower()
    location = request.args.get('location', '').lower()
    
    all_jobs = Job.query.all()
    filtered = []
    
    # Check for authenticated user
    user = get_current_user()
    profile = user.profile if user else None

    for job in all_jobs:
        match = True
        if q:
            text = (job.title + job.description + (job.tags or '')).lower()
            if q not in text:
                match = False
        if location:
            if location not in (job.location or '').lower():
                match = False

        if match:
            filtered.append(job)

    job_list = []
    for job in filtered:
        job_data = {
            'title': job.title,
            'company': job.company,
            'department': job.department,
            'description': job.description,
            'location': job.location,
            'type': job.type,
            'remote_option': job.remote_option,
            'salary': job.salary, 
            'experience_level': job.experience_level,
            'education': job.education,
            'benefits': job.benefits,
            'application_deadline': job.application_deadline,
            'tags': job.tags.split(',') if job.tags else [],
            'created_at': job.created_at,
            'id': job.id
        }
        
        if profile:
            try:
                score = matching_service.calculate_score(profile, job)
                job_data['match_score'] = score
            except:
                job_data['match_score'] = 0
        
        job_list.append(job_data)

    # Sort by match score
    if profile:
        job_list.sort(key=lambda x: x.get('match_score', 0), reverse=True)

    return jsonify({
        'pagination': {'total_items': len(job_list)},
        'jobs': job_list
    })

@job_bp.route('/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    job = Job.query.get_or_404(job_id)
    return jsonify({
        'id': job.id,
        'title': job.title,
        'company': job.company,
        'department': job.department,
        'description': job.description,
        'location': job.location,
        'type': job.type,
        'remote_option': job.remote_option,
        'salary': job.salary, 
        'experience_level': job.experience_level,
        'education': job.education,
        'benefits': job.benefits,
        'application_deadline': job.application_deadline,
        'tags': job.tags.split(',') if job.tags else [],
        'created_at': job.created_at,
    })

# --- HR - Jobs Endpoints ---

@job_bp.route('/hr/jobs/my', methods=['GET'])
def get_my_jobs():
    user = get_current_user()
    if not user or user.role != 'hr':
        return jsonify({'error': 'Unauthorized: HR role required'}), 403

    # Fetch jobs posted by this user
    jobs = Job.query.filter_by(posted_by=user.id).all()

    job_list = [{
        'id': job.id,
        'title': job.title,
        'company': job.company,
        'department': job.department,
        'description': job.description,
        'location': job.location,
        'type': job.type,
        'remote_option': job.remote_option,
        'salary': job.salary, 
        'experience_level': job.experience_level,
        'education': job.education,
        'benefits': job.benefits,
        'application_deadline': job.application_deadline,
        'tags': job.tags.split(',') if job.tags else [],
        'created_at': job.created_at,
        'company_logo_url': getattr(job, 'company_logo_url', ''),
        'applications_count': len(job.applications),
        'qualified_count': len([app for app in job.applications if (app.match_score or 0) >= 80]),
        'status': getattr(job, 'status', 'Open')
    } for job in jobs]

    return jsonify({'jobs': job_list})

@job_bp.route('/hr/jobs', methods=['POST'])
def create_job():
    user = get_current_user()
    if not user or user.role != 'hr':
        return jsonify({'error': 'Unauthorized: HR role required'}), 403

    data = request.json

    job = Job(
        title=data.get('title'),
        description=data.get('description'),
        company=data.get('company'),
        department=data.get('department'),
        location=data.get('location'),
        type=data.get('type'),
        remote_option=data.get('remote_option'),
        experience_level=data.get('experience_level'),
        education=data.get('education'),
        salary=data.get('salary'),
        tags=','.join(data.get('tags', [])) if isinstance(data.get('tags'), list) else data.get('tags'),
        benefits=data.get('benefits'),
        application_deadline=data.get('application_deadline'),
        posted_by=user.id  # Assign to current user
    )
    db.session.add(job)
    db.session.commit()
    return jsonify({'message': 'Job created successfully', 'id': job.id}), 201

@job_bp.route('/hr/jobs/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    # TODO: Auth Check (HR Role + Ownership)
    job = Job.query.get_or_404(job_id)
    data = request.json

    if 'title' in data: job.title = data['title']
    if 'description' in data: job.description = data['description']
    if 'company' in data: job.company = data['company']
    if 'department' in data: job.department = data['department']
    if 'location' in data: job.location = data['location']
    if 'type' in data: job.type = data['type']
    if 'remote_option' in data: job.remote_option = data['remote_option']
    if 'experience_level' in data: job.experience_level = data['experience_level']
    if 'education' in data: job.education = data['education']
    if 'salary' in data: job.salary = data['salary']
    if 'tags' in data: job.tags = data['tags']
    if 'benefits' in data: job.benefits = data['benefits']
    if 'application_deadline' in data: job.application_deadline = data['application_deadline']

    db.session.commit()
    return jsonify({'message': 'Job updated successfully'})

@job_bp.route('/hr/jobs/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    # TODO: Auth Check (HR Role + Ownership)
    job = Job.query.get_or_404(job_id)
    db.session.delete(job)
    db.session.commit()
    return jsonify({'message': 'Job deleted successfully'})

@job_bp.route('/jobs/recommendations', methods=['GET'])
def get_job_recommendations():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    profile = user.profile
    if not profile:
        return jsonify({'error': 'Profile required for recommendations'}), 400

    jobs = Job.query.all()
    recommended = []

    for job in jobs:
        # Calculate score locally (fast)
        score = matching_service.calculate_score(profile, job)
        
        # Only recommend if score > 70% (Lowered threshold slightly to ensure results)
        if score > 70: 
            job_data = {
                'id': job.id,
                'title': job.title,
                'company': job.company,
                'location': job.location,
                'type': job.type,
                'salary': job.salary,
                'description': job.description,
                'experience_level': job.experience_level,
                'education': job.education,
                'remote_option': job.remote_option,
                'benefits': job.benefits,
                'tags': job.tags.split(',') if job.tags else [],
                'match_score': score
            }
            recommended.append(job_data)

    # Sort by score descending
    recommended.sort(key=lambda x: x['match_score'], reverse=True)
    
    return jsonify({
        'jobs': recommended[:5] # Return top 5
    })

# Add this endpoint to get explanation for a specific job without applying
@job_bp.route('/jobs/<int:job_id>/match-analysis', methods=['GET'])
def get_job_match_analysis(job_id):
    user = get_current_user()
    if not user: return jsonify({'error': 'Unauthorized'}), 401
    
    job = Job.query.get_or_404(job_id)
    profile = user.profile
    
    score = matching_service.calculate_score(profile, job)
    explanation_json = matching_service.generate_explanation(profile, job, score)
    
    return jsonify({
        'match_score': score,
        'analysis': json.loads(explanation_json)
    })