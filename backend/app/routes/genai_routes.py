from flask import Blueprint, request, jsonify
from ..services.llm_service import llm_service
from ..services.matching_service import matching_service
from ..models import Job, Application, User, ChatMessage, Employee # Added Employee
from ..database import db
from ..utils import get_current_user
from ..genai_helpers import handle_data_query, KNOWLEDGE_BASE_HR, KNOWLEDGE_BASE_CANDIDATE
import json
import io
from pypdf import PdfReader

genai_bp = Blueprint('genai_bp', __name__)

@genai_bp.route('/gen-ai/chat', methods=['POST'])
def chat_with_ai():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json or {}
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400

    # Select Role-Based Knowledge Base
    if user.role == 'hr':
        role_knowledge = KNOWLEDGE_BASE_HR
        role_persona = "HR Recruiter"
    elif user.role == 'candidate':
        role_knowledge = KNOWLEDGE_BASE_CANDIDATE
        role_persona = "Job Seeker"
    else:
        role_knowledge = ""
        role_persona = "User"

    # Save User Message
    user_msg = ChatMessage(user_id=user.id, sender='user', message=prompt)
    db.session.add(user_msg)

    # Handle Data Queries (Delegate to helper)
    query_result = handle_data_query(user, prompt)
    
    # Construct System and User Prompts
    system_context = f"""
    {role_knowledge}
    
    You are a helpful HR assistant named HireHero AI. The user, {user.first_name}, is authenticated as a {role_persona}. 
    Use the knowledge base above to answer procedural questions and to clarify system capabilities, strictly adhering to the user's role access.
    **CRITICAL INSTRUCTION: If data is provided below, use it to answer factual questions. For salary, preserve the exact formatting provided.**
    
    **If the user asks a question unrelated to the platform or employment (e.g., general knowledge, movies, history), politely decline and remind them of your focus.**
    """
    
    user_prompt_to_llm = prompt
    
    if query_result['action'] == 'llm_with_data':
        # Inject the fetched data
        system_context += f"\n\n--- LIVE DATABASE CONTEXT ---\n{query_result['context']}"
        user_prompt_to_llm = query_result['prompt_extension']
    
    # Generate Response
    reply = llm_service.generate_text(system_context, user_prompt_to_llm)

    # Save Bot Response
    bot_msg = ChatMessage(user_id=user.id, sender='bot', message=reply)
    db.session.add(bot_msg)
    db.session.commit()

    return jsonify({
        'reply': reply,
        'session_id': data.get('session_id', 'session_123'),
    })

# --- Get Chat History ---
@genai_bp.route('/gen-ai/history', methods=['GET'])
def get_chat_history():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Fetch all messages for this user, sorted by time
    messages = ChatMessage.query.filter_by(user_id=user.id).order_by(ChatMessage.timestamp.asc()).all()
    
    history = [{
        'sender': msg.sender,
        'text': msg.message,
        'timestamp': msg.timestamp
    } for msg in messages]
    
    return jsonify(history)

# --- Clear Chat History ---
@genai_bp.route('/gen-ai/history', methods=['DELETE'])
def clear_chat_history():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    ChatMessage.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    
    return jsonify({'message': 'History cleared'})

@genai_bp.route('/gen-ai/parse-resume', methods=['POST'])
def parse_resume():
    """
    Parses an uploaded resume file (PDF or Text) using LLM for structured data extraction.
    Filters out PII (Name, Email, Phone) in the response.
    """
    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file uploaded'}), 400
    
    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    text_content = ""
    
    try:
        # Extract Text based on file type
        if file.filename.lower().endswith('.pdf'):
            try:
                pdf_reader = PdfReader(file)
                for page in pdf_reader.pages:
                    text_content += page.extract_text() + "\n"
            except Exception as e:
                return jsonify({'error': f'Failed to parse PDF: {str(e)}'}), 400
        else:
            # Assume text/markdown
            try:
                text_content = file.read().decode('utf-8')
            except UnicodeDecodeError:
                return jsonify({'error': 'File format not supported. Please upload PDF or text file.'}), 400

        if not text_content.strip():
            return jsonify({'error': 'Could not extract text from file.'}), 400

        # Parse using LLM Service
        extracted_data = matching_service.parse_resume_with_llm(text_content)
        
        return jsonify({
            'message': 'Resume parsed successfully',
            'data': extracted_data
        })

    except Exception as e:
        print(f"Resume Processing Error: {e}")
        return jsonify({'error': 'Internal server error processing resume'}), 500

@genai_bp.route('/gen-ai/generate-jd', methods=['POST'])
def generate_jd():
    data = request.json
    title = data.get('title')
    company = data.get('company_name')
    department = data.get('department', 'General')
    
    # New Fields
    skills = data.get('skills', [])
    experience = data.get('experience', '')
    education = data.get('education', '')

    # Format skills for prompt
    skills_str = ", ".join(skills) if skills else "relevant industry skills"

    # UPDATED PROMPT: Include all new fields
    system_prompt = """You are an expert HR assistant. Generate a detailed job description in strict JSON format. 
    The JSON must have the following keys:
    - "generated_description": A professional summary of the role.
    - "generated_responsibilities": A list of strings (3-5 bullet points).
    - "generated_qualifications": A list of strings (3-5 bullet points).
    Do not include any markdown formatting like ```json ... ```."""
    
    user_prompt = f"""
    Generate a detailed Job Description for the position of '{title}' at '{company}' in the '{department}' department.
    
    Context:
    - Required Skills: {skills_str}
    - Experience Level: {experience}
    - Education Required: {education}
    
    Ensure the description and requirements align with these specific details.
    """

    response_text = llm_service.generate_text(system_prompt, user_prompt)

    # Clean up markdown if Gemini adds it despite instructions
    if response_text.startswith("```json"):
        response_text = response_text.replace("```json", "").replace("```", "")
    elif response_text.startswith("```"):
        response_text = response_text.replace("```", "")

    try:
        response_json = json.loads(response_text)
    except:
        # Fallback if JSON parsing fails
        response_json = {
            "generated_description": response_text,
            "generated_responsibilities": [],
            "generated_qualifications": []
        }

    return jsonify(response_json)

@genai_bp.route('/gen-ai/generate-cover-letter', methods=['POST'])
def generate_cover_letter():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    job_id = data.get('job_id')
    user_notes = data.get('user_notes', '')

    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    # Fetch user profile
    profile = user.profile
    profile_summary = profile.summary if profile else ""
    full_name = f"{user.first_name} {user.last_name}"

    # UPDATED PROMPT LOGIC
    system_prompt = """You are a professional cover letter generator. 
    Output ONLY the final cover letter text. 
    Do not include any conversational filler (like "Here is a draft", "Good luck"), instructions, or advice.
    Start directly with the candidate's header and end with the signature.
    """

    user_prompt = f"""
    Write a professional cover letter using the following details:
    
    CANDIDATE NAME: {full_name}
    JOB TITLE: {job.title}
    COMPANY NAME: {job.company}
    PROFILE SUMMARY: {profile_summary}
    USER NOTES: {user_notes}

    Requirements:
    1. Use the Candidate Name ({full_name}) in the header and signature.
    2. Use the Company Name ({job.company}) and Job Title ({job.title}) in the body of the letter.
    3. Use placeholders ONLY for missing contact info: "[Your Address]", "[Your Phone Number]", "[Your Email]", and "[Date]".
    4. The tone should be professional and enthusiastic.
    """

    draft = llm_service.generate_text(system_prompt, user_prompt)

    return jsonify({
        'generated_draft': draft
    })

@genai_bp.route('/gen-ai/generate-interview-guide', methods=['POST'])
def generate_interview_guide():
    data = request.json
    jd_text = data.get('job_description')

    # UPDATED PROMPT: Explicitly ask for JSON structure
    system_prompt = """You are an expert HR interviewer. Generate a structured interview guide in strict JSON format based on the job description.
    The JSON must have the following keys:
    - "job_title": The extracted job title.
    - "behavioral_questions": A list of 3-5 behavioral interview questions (strings).
    - "technical_questions": A list of 3-5 technical interview questions specific to the role (strings).
    - "scoring_rubric": A string containing a guide on how to evaluate candidates (e.g., "1 - Poor: ..., 3 - Average: ..., 5 - Excellent: ...").
    Do not include any markdown formatting like ```json ... ```."""

    user_prompt = f"JD: {jd_text}"

    response_text = llm_service.generate_text(system_prompt, user_prompt)

    # Clean up markdown if Gemini adds it despite instructions
    if response_text.startswith("```json"):
        response_text = response_text.replace("```json", "").replace("```", "")
    elif response_text.startswith("```"):
        response_text = response_text.replace("```", "")

    try:
        response_json = json.loads(response_text)
    except:
         # Fallback: puts text in rubric if parsing fails, but prevents crash
         response_json = {
            "job_title": "Role",
            "behavioral_questions": [],
            "technical_questions": [],
            "scoring_rubric": response_text
        }

    return jsonify(response_json)

@genai_bp.route('/gen-ai/summarize-feedback', methods=['POST'])
def summarize_feedback():
    data = request.json
    notes = data.get('raw_feedback_notes')

    candidate_name = data.get('candidate_name', 'The Candidate')
    job_description = data.get('job_description', '')

    system_prompt = f"""You are an expert HR assistant. Summarize the interview feedback for candidate '{candidate_name}'.
    
    Context:
    - Job Description Context: {job_description[:1500] if job_description else "Not provided"}...
    
    Task:
    Summarize the provided interview notes into a structured JSON format.
    Compare the feedback against the Job Description requirements where possible.
    
    The JSON must have the following keys:
    - "summary": A concise paragraph summarizing {candidate_name}'s performance and fit for the role (string).
    - "strengths": A list of the candidate's key strengths (list of strings).
    - "weaknesses": A list of the candidate's key weaknesses or areas for improvement (list of strings).
    - "recommendation": A short recommendation string (e.g., "Hire", "Strong Hire", "No Hire", "Needs Discussion").
    Do not include any markdown formatting like ```json ... ```."""

    user_prompt = f"Feedback Notes:\n{notes}"

    response_text = llm_service.generate_text(system_prompt, user_prompt)

    # Clean up markdown if Gemini adds it despite instructions
    if response_text.startswith("```json"):
        response_text = response_text.replace("```json", "").replace("```", "")
    elif response_text.startswith("```"):
        response_text = response_text.replace("```", "")

    try:
        response_json = json.loads(response_text)
    except:
        # Fallback: put text in summary if parsing fails
        response_json = {
            "summary": response_text,
            "strengths": ["Could not parse strengths."],
            "weaknesses": ["Could not parse weaknesses."],
            "recommendation": "Needs Discussion"
        }

    return jsonify(response_json)

# --- Mock Interview Endpoints ---

@genai_bp.route('/gen-ai/mock-interview/start', methods=['POST'])
def start_mock_interview():
    user = get_current_user()
    if not user: return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    job_id = data.get('job_id')
    
    job = Job.query.get(job_id)
    if not job: return jsonify({'error': 'Job not found'}), 404

    # Prompt for Questions
    system_prompt = """You are an expert technical interviewer. Generate 5 interview questions for the specified role.
    - 3 Questions must be Technical (specific to the skills/stack).
    - 2 Questions must be Behavioral (STAR method style).
    - Output strict JSON: A simple list of strings. ["Question 1", "Question 2", ...]
    - Do not include markdown formatting."""
    
    user_prompt = f"Role: {job.title}\nCompany: {job.company}\nDescription: {job.description[:500]}..."

    response_text = llm_service.generate_text(system_prompt, user_prompt)
    
    # Cleanup & Parse
    if response_text.startswith("```json"):
        response_text = response_text.replace("```json", "").replace("```", "")
    elif response_text.startswith("```"):
        response_text = response_text.replace("```", "")

    try:
        questions = json.loads(response_text)
        return jsonify({'questions': questions})
    except:
        # Fallback if AI fails json structure
        return jsonify({'questions': [
            "Tell me about yourself.",
            "What is your greatest strength?",
            "Describe a technical challenge you faced.",
            "Why do you want to join us?",
            "Where do you see yourself in 5 years?"
        ]})

@genai_bp.route('/gen-ai/mock-interview/submit', methods=['POST'])
def submit_mock_interview():
    user = get_current_user()
    if not user: return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    job_id = data.get('job_id')
    transcript = data.get('answers', []) # List of {question, answer}

    job = Job.query.get(job_id)
    if not job: return jsonify({'error': 'Job not found'}), 404

    # Format Transcript for AI
    transcript_text = ""
    for idx, item in enumerate(transcript):
        transcript_text += f"Q{idx+1}: {item['question']}\nCandidate Answer: {item['answer']}\n\n"

    system_prompt = """You are an expert Hiring Manager. specific job. 
    Evaluate the candidate's interview session.
    Output strict JSON with the following structure:
    {
        "overall_score": 8,  // Integer 1-10, make it the average of the rating score for each question
        "overall_feedback": "One sentence summary.",
        "question_evaluations": [
            {
                "question": "The question text...",
                "rating": 7, // 1-10
                "feedback": "Specific advice on how to improve this specific answer."
            },
            ... for all 5 questions
        ]
    }
    Do not include markdown."""

    user_prompt = f"Job: {job.title}\n\nInterview Transcript:\n{transcript_text}"

    response_text = llm_service.generate_text(system_prompt, user_prompt)

    # Cleanup & Parse
    if response_text.startswith("```json"):
        response_text = response_text.replace("```json", "").replace("```", "")
    elif response_text.startswith("```"):
        response_text = response_text.replace("```", "")

    try:
        evaluation = json.loads(response_text)
        return jsonify(evaluation)
    except:
        return jsonify({'error': 'Failed to generate evaluation'}), 500

@genai_bp.route('/gen-ai/performance-insights', methods=['POST'])
def generate_performance_insights():
    user = get_current_user()
    if not user or user.role != 'hr':
        return jsonify({'error': 'Unauthorized'}), 403

    # 1. Fetch Data
    employees = Employee.query.filter_by(hired_by=user.id).all()
    if not employees:
        return jsonify([])

    # 2. Pre-process Stats (Python side)
    dept_scores = {}
    recent_comments = []
    total_rating = 0
    rating_count = 0
    
    for emp in employees:
        emp_ratings = [p.rating for p in emp.performances if p.rating]
        if emp_ratings:
            avg = sum(emp_ratings) / len(emp_ratings)
            
            # Dept Stats
            dept = emp.department or "Unknown"
            if dept not in dept_scores:
                dept_scores[dept] = {'sum': 0, 'count': 0}
            dept_scores[dept]['sum'] += avg
            dept_scores[dept]['count'] += 1
            
            total_rating += avg
            rating_count += 1

        # Collect last 2 comments per employee
        if emp.performances:
            sorted_reviews = sorted(emp.performances, key=lambda x: x.date, reverse=True)
            for p in sorted_reviews[:2]:
                if p.comments:
                    recent_comments.append(f"[{emp.department}] {p.comments}")

    recent_comments = recent_comments[:15]

    # 3. Construct Context
    dept_summary = ", ".join([
        f"{d}: {round(v['sum']/v['count'], 1)}" 
        for d, v in dept_scores.items()
    ])
    
    global_avg = round(total_rating / rating_count, 1) if rating_count else 0

    stats_context = f"""
    Global Average Rating: {global_avg}/5.0
    Department Averages: {dept_summary}
    Recent Review Sample:
    {chr(10).join(recent_comments)}
    """

    # --- UPDATED PROMPT: Enforce 1 of each type ---
    system_prompt = """
    You are an HR Data Analyst for HireHero. Analyze the provided performance metrics and review comments.
    Generate exactly 3 actionable insights in strict JSON format.
    
    You MUST generate exactly one insight for each of the following categories:
    1. A "success" insight: Highlight a high-performing department, positive trend, or praise.
    2. A "warning" insight: Highlight a low-performing area, risk, or negative sentiment.
    3. An "info" insight: A neutral observation about the data distribution or volume.
    
    The output must be a JSON list of objects with these keys:
    - "title": Short headline (e.g., "Engineering Exceling").
    - "detail": A 1-2 sentence explanation.
    - "type": The category ("success", "warning", or "info").
    
    Do not include markdown formatting.
    """
    
    user_prompt = f"Performance Data Analysis:\n{stats_context}"

    # 4. Call AI
    response_text = llm_service.generate_text(system_prompt, user_prompt)

    if response_text.startswith("```json"):
        response_text = response_text.replace("```json", "").replace("```", "")
    elif response_text.startswith("```"):
        response_text = response_text.replace("```", "")

    try:
        insights = json.loads(response_text)
        return jsonify(insights)
    except Exception as e:
        print(f"Insight Generation Error: {e}")
        return jsonify([
            {"title": "Analysis Error", "detail": "Could not generate insights.", "type": "info"}
        ])