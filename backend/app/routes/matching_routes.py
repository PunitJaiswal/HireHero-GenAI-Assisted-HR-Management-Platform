from flask import Blueprint, request, jsonify
from ..services.llm_service import llm_service
from ..utils import get_current_user

matching_bp = Blueprint('matching_bp', __name__)

@matching_bp.route('/hr/matching/rank-resumes', methods=['POST'])
def rank_resumes():
    user = get_current_user()
    if not user or user.role != 'hr':
        return jsonify({'error': 'Unauthorized: HR role required'}), 403

    if 'resumes' not in request.files:
        return jsonify({'error': 'No resumes uploaded'}), 400

    resumes = request.files.getlist('resumes')
    job_description = request.form.get('job_description')

    if not job_description:
         return jsonify({'error': 'Job description is required'}), 400

    # Mock Ranking Logic
    ranked_candidates = []
    for idx, resume in enumerate(resumes):
        # In a real app, parse the PDF/DOCX content here
        filename = resume.filename

        # Mock score based on filename length or random
        import random
        score = random.uniform(70, 99)

        ranked_candidates.append({
            'rank': 0, # To be sorted
            'match_score': round(score, 1),
            'file_name': filename,
            'parsed_name': f"Candidate {idx+1}", # Mock
            'parsed_email': f"candidate{idx+1}@example.com",
            'match_explanation': {
                'summary': f"Good match for {filename}",
                'matched_skills': ['Python', 'Communication'],
                'missing_skills': ['Java'],
                'experience_highlights': "5 years of experience."
            }
        })

    # Sort by score
    ranked_candidates.sort(key=lambda x: x['match_score'], reverse=True)

    # Assign ranks
    for i, cand in enumerate(ranked_candidates):
        cand['rank'] = i + 1

    return jsonify({
        'ranking': ranked_candidates[:10] # Top 10
    })
