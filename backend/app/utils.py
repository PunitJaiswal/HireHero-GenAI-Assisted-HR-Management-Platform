from flask import request, current_app
import jwt
import re
from .models import User

def get_current_user():
    """
    Retrieves the current authenticated user from Authorization header (Bearer Token)
    or legacy X-User-Id header.
    """
    # 1. Try Bearer Token (Preferred)
    auth_header = request.headers.get('Authorization', None)
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            user = User.query.get(payload.get('user_id'))
            if user:
                return user
        except Exception:
            pass # Fallback to legacy

    # 2. Legacy: X-User-Id
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return None

    # user_id is now firstname+last 3 digits of phone
    # Find user by matching first_name and last 3 digits of phone in profile
    match = re.match(r"([A-Za-z]+)(\d{1,3})$", user_id)
    if not match:
        return None
    first_name, last3 = match.groups()
    # Find all users with this first name
    users = User.query.filter_by(first_name=first_name).all()
    for user in users:
        profile = user.profile
        if profile and profile.phone:
            phone_digits = ''.join(filter(str.isdigit, profile.phone))
            if phone_digits[-3:] == last3:
                return user
    return None
