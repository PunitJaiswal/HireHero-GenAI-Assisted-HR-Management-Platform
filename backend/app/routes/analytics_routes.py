from flask import Blueprint, jsonify

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/insights', methods=['GET'])
def get_analytics_insights():
    # Example: Replace with real AI/ML or DB logic
    insights = [
        {"title": "Top Performer", "detail": "User_01 exceeded all goals by 25% this quarter."},
        {"title": "Team Growth", "detail": "Engineering team improved 18% this quarter."},
        {"title": "Needs Support", "detail": "3 employees showing performance decline."}
    ]
    return jsonify(insights)
