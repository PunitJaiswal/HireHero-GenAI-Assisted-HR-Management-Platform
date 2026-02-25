from flask import Blueprint, request, jsonify

timeline_bp = Blueprint('timeline_bp', __name__)

@timeline_bp.route('/timeline/my', methods=['GET'])
def get_my_timeline():
    # TODO: Auth Check
    return jsonify([
        {
            'id': 'evt_1',
            'timestamp': '2025-10-21T09:00:00Z',
            'type': 'application_submitted',
            'title': 'Applied to Job A',
            'description': 'You applied...',
            'link_url': '/applications/1'
        }
    ])
