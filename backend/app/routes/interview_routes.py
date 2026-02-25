from flask import Blueprint, request, jsonify
from ..database import db
from ..models import Interview, Application
from ..utils import get_current_user
from datetime import datetime

interview_bp = Blueprint('interview_bp', __name__)

@interview_bp.route('/interviews/my', methods=['GET'])
def get_my_interviews():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    # Fetch interviews where the associated application status is 'interviewing'
    interviews = (Interview.query
                  .join(Application, Interview.application_id == Application.id)
                  .filter(Application.user_id == user.id)
                  .filter(Application.status == 'interviewing') # <--- Added Filter
                  .order_by(Interview.scheduled_at.asc())
                  .all())

    results = []
    for i in interviews:
        data = i.to_dict()
        if i.application and i.application.job:
            data['job_title'] = i.application.job.title
            data['company_name'] = i.application.job.company
        else:
            data['job_title'] = 'Pending Role'
            data['company_name'] = 'HireHero'
        results.append(data)

    return jsonify(results)

@interview_bp.route('/hr/interviews', methods=['POST'])
def schedule_interview():
    user = get_current_user()
    if not user or user.role != 'hr':
        return jsonify({'error': 'Unauthorized: HR role required'}), 403

    data = request.json
    
    # Validate required fields
    if not data.get('application_id') or not data.get('scheduled_at'):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        # Convert string date to datetime object
        # Frontend sends ISO string: "2025-10-25T14:00:00.000Z"
        scheduled_dt = datetime.fromisoformat(data['scheduled_at'].replace('Z', '+00:00'))
        
        interview = Interview(
            application_id=data['application_id'],
            stage=data.get('stage', 'interview'),
            scheduled_at=scheduled_dt,
            location_type=data.get('location_type', 'video'),
            location_detail=data.get('location_detail', '')
        )
        
        db.session.add(interview)
        db.session.commit()
        
        return jsonify({
            'message': 'Interview scheduled successfully',
            'interview': interview.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500