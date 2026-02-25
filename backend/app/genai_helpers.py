from .models import Job, Application, Employee, User, Interview, Profile, Education, Experience
import json
import re

# --- KNOWLEDGE BASES ---

KNOWLEDGE_BASE_CANDIDATE = """
HireHero Application Knowledge Base for Job Seekers:
- Your Role: Job Seeker (candidate). You cannot access HR features (like adding employees or performance reviews).
- Capabilities: Apply to Jobs, Update Profile/Resume, View AI Match Score, Check Application Status, Practice Mock Interviews, Generate Cover Letters.
- Profile Management:
    - To update resume: Navigate to the 'Profile' tab in the UI.
    - To update personal info (phone, summary, location): Use the 'Profile' tab.
- Application Tracking:
    - To check application status: Go to the 'Applications' tab in the UI. Statuses include applied, interviewing, offer_extended, rejected, withdrawn.
    - To accept an offer: Use the 'Accept' button in the application details view.
- Tools:
    - AI Studio: Ask questions, generate cover letters, start mock interviews.
- Core Data: You can query public job details (title, salary, location, description) and your own application status.
"""

KNOWLEDGE_BASE_HR = """
HireHero Application Knowledge Base for HR Professionals:
- Your Role: HR Recruiter (hr). You cannot apply for jobs or manage candidate-side profiles.
- Capabilities: Post Jobs, Add Employees, View Applicants, Schedule Interviews, Generate Reports, JD Generation, Interview Guide Generation, Performance Analytics.
- Recruitment Management:
    - To post a job: Navigate to the 'Post Job' page.
    - To manage applicants: Use the 'Recruitment' tab in the UI.
    - To schedule an interview: Click the 'Schedule Interview' button on an application card.
- Employee Management:
    - To add a new employee: Navigate to the 'Add Employee' page.
    - To view/edit employees: Use the 'Employees' tab.
    - To add a performance review: Click the 'Review' button on an employee's record.
- Analytics & Reports:
    - To generate performance insights: Go to the 'Performance' tab.
    - To generate formal reports (PDF/CSV): Use the 'Generate Report' page.
- Tools:
    - AI Studio: JD Generator (generate detailed job descriptions), Interview Guide Tool (create structured interview questions), Feedback Summarizer.
- Core Data: You can query details about your posted jobs (status, applicant counts) and your hired employees (performance, roles).
"""

# --- UTILITIES ---

def format_salary(amount, employment_type):
    if not amount:
        return "Not specified"
    
    clean_amount = re.sub(r'[^\d.]', '', str(amount))
    try:
        value = float(clean_amount)
    except ValueError:
        return amount

    if value >= 100000:
        formatted = f"₹{(value / 100000):.1f}L"
    elif value >= 1000:
        formatted = f"₹{(value / 1000):.0f}K"
    else:
        formatted = f"₹{value}"

    lower_type = (employment_type or "").lower()
    
    if lower_type in ["full-time", "part-time"]:
        suffix = " per annum"
    elif lower_type == "internship":
        suffix = " per month"
    elif lower_type == "contract":
        suffix = " fixed"
    else:
        suffix = ""
        
    return f"{formatted}{suffix}".strip()

def handle_data_query(user, user_prompt):
    """
    Analyzes the user's role and prompt to fetch relevant data from the database.
    Supports:
    - Candidate: My Applications
    - HR: My Employees, My Posted Jobs
    - Global: General Job Market Data
    """
    prompt_lower = user_prompt.lower()
    
    # --- HR Specific Queries ---
    if user.role == 'hr':
        # Employee / Team Queries
        employee_keywords = ['employees', 'my employees', 'hired', 'team', 'staff', 'people i manage', 'work for me']
        if any(k in prompt_lower for k in employee_keywords):
            # Fetch employees hired by this HR user
            employees = Employee.query.filter_by(hired_by=user.id).all()
            
            if employees:
                emp_data = []
                for emp in employees:
                    # Access the User relationship to get the name
                    name = f"{emp.user.first_name} {emp.user.last_name}" if emp.user else "Unknown User"
                    formatted_sal = format_salary(emp.salary, emp.employment_type)
                    
                    emp_data.append({
                        'name': name,
                        'role': emp.job_title,
                        'department': emp.department,
                        'location': emp.job_location,
                        'salary': formatted_sal
                    })
                
                context_data = json.dumps(emp_data, indent=2)
                return {
                    'action': 'llm_with_data',
                    'context': f"HR's Employee Team Data:\n{context_data}",
                    'prompt_extension': f"Based on the Employee Data below, answer the HR's query: '{user_prompt}'. Summarize the team details clearly."
                }

        # Job Posting Queries
        my_job_keywords = ['jobs', 'my jobs', 'posted jobs', 'listings', 'positions i created', 'my openings']
        if any(k in prompt_lower for k in my_job_keywords):
            # Fetch jobs posted by this HR user
            my_jobs = Job.query.filter_by(posted_by=user.id).all()
            
            if my_jobs:
                job_list = []
                for job in my_jobs:
                    # Calculate applicant count
                    app_count = len(job.applications) if job.applications else 0
                    
                    job_list.append({
                        'title': job.title,
                        'company': job.company,
                        'created_at': job.created_at.strftime("%Y-%m-%d"),
                        'applicant_count': app_count,
                        'status': 'Active'
                    })
                
                context_data = json.dumps(job_list, indent=2)
                return {
                    'action': 'llm_with_data',
                    'context': f"HR's Posted Jobs Data:\n{context_data}",
                    'prompt_extension': f"Based on the Job Postings below, answer the HR's query: '{user_prompt}'. Provide an overview of their active listings and applicant traction."
                }

    # --- Candidate Specific Queries ---
    elif user.role == 'candidate':
        # Job Fit / Career Advice Queries
        fit_keywords = ['should i apply', 'am i a fit', 'good fit', 'match', 'qualified', 'chance', 'suitability']
        
        if any(k in prompt_lower for k in fit_keywords):
            # Fetch ALL job titles
            all_jobs = Job.query.with_entities(Job.title).all()
            
            # Extract plain strings from tuples and remove duplicates
            titles = list(set([j[0] for j in all_jobs]))
            
            # Sort by length (descending) so we match "Senior Software Engineer" before "Software Engineer"
            titles.sort(key=len, reverse=True)
            
            matched_title = None
            for title in titles:
                if title.lower() in prompt_lower:
                    matched_title = title
                    break # Stop at the first (longest) match
            
            if matched_title:
                job = Job.query.filter_by(title=matched_title).first()
                profile = Profile.query.filter_by(user_id=user.id).first()
                
                if job:
                    if profile:
                        # Prepare data for LLM
                        education_records = Education.query.filter_by(profile_id=profile.id).all()
                        experience_records = Experience.query.filter_by(profile_id=profile.id).all()
                        
                        edu_list = [f"{e.degree} at {e.institution} ({e.start_date} - {e.end_date or 'Present'})" for e in education_records] if education_records else ["Not listed"]
                        exp_list = [f"{e.title} at {e.company} ({e.start_date} - {e.end_date or 'Present'})" for e in experience_records] if experience_records else ["Not listed"]
                        
                        profile_summary = f"""
                        - Summary: {profile.summary or 'None'}
                        - Education: {', '.join(edu_list)}
                        - Experience: {'; '.join(exp_list)}
                        """
                        
                        job_details = f"""
                        - Role: {job.title}
                        - Required Skills: {job.tags}
                        - Education Level: {job.education}
                        - Experience Level: {job.experience_level}
                        - Description: {job.description[:600]}...
                        """
                        
                        return {
                            'action': 'llm_with_data',
                            'context': f"Candidate Profile:\n{profile_summary}\n\nTarget Job Details:\n{job_details}",
                            'prompt_extension': f"Act as a Career Coach. Compare the Candidate Profile with the Target Job Details. Answer the user's question: '{user_prompt}' strictly based on the data provided. Highlight matching skills and any missing requirements."
                        }
                    else:
                        return {
                            'action': 'llm_with_data',
                            'context': "User found the job but has no profile data (Education/Experience) entered in the system.",
                            'prompt_extension': "The user is asking for advice, but their profile is empty. Politely inform them that you need them to update their Profile (Education, Experience, Skills) in the 'Profile' tab before you can analyze their fit for this role."
                        }
            else:
                # --- General "What should I apply for?" ---
                # Fetch ALL jobs to let AI find the best matches
                all_jobs = Job.query.all()
                if not all_jobs:
                    return {'action': 'llm_only'} # No jobs to recommend
                
                # Create a concise summary of all available jobs
                jobs_summary = []
                for j in all_jobs:
                    jobs_summary.append(f"- {j.title} at {j.company} (Skills: {j.tags}, Level: {j.experience_level})")
                
                jobs_context_str = "\n".join(jobs_summary)
                
                return {
                    'action': 'llm_with_data',
                    'context': f"Candidate Profile:\n{profile_summary}\n\nAvailable Jobs List:\n{jobs_context_str}",
                    'prompt_extension': f"Act as a Career Advisor. The user is asking for job recommendations ('{user_prompt}'). Based on their Profile and the Available Jobs List provided above, recommend the top 3 roles they are best suited for and explain why."
                }
                    
        # Interview Queries
        interview_keywords = ['interview', 'schedule', 'meeting', 'when', 'upcoming']
        # Check if the query is actually about interviews
        if any(k in prompt_lower for k in interview_keywords):
            # Fetch interviews for this candidate by joining with Application
            interviews = Interview.query.join(Application).filter(Application.user_id == user.id).order_by(Interview.scheduled_at.asc()).all()
            
            if interviews:
                inv_data = []
                for inv in interviews:
                    # Get Job info from the related application
                    job_title = inv.application.job.title if (inv.application and inv.application.job) else "Unknown Job"
                    company = inv.application.job.company if (inv.application and inv.application.job) else "Unknown Company"
                    
                    inv_data.append({
                        'job_role': job_title,
                        'company': company,
                        'stage': inv.stage,
                        'date_time': inv.scheduled_at.strftime("%Y-%m-%d %H:%M"),
                        'type': inv.location_type,
                        'link_or_location': inv.location_detail
                    })
                
                context_data = json.dumps(inv_data, indent=2)
                return {
                    'action': 'llm_with_data',
                    'context': f"User's Scheduled Interviews:\n{context_data}",
                    'prompt_extension': f"Based on the Interview Schedule below, answer the user's query: '{user_prompt}'. Provide details on dates, times, and meeting links if requested."
                }

        # Application Status Queries
        app_keywords = ['application', 'status', 'applied', 'my jobs', 'track', 'update on']
        
        # Check if asking about specific application status
        if any(k in prompt_lower for k in app_keywords):
            applications = Application.query.filter_by(user_id=user.id).all()
            
            if applications:
                app_data = []
                for app in applications:
                    job_title = app.job.title if app.job else "Unknown Role"
                    company_name = app.job.company if app.job else "Unknown Company"
                    
                    app_data.append({
                        'job_title': job_title,
                        'company': company_name,
                        'status': app.status,
                        'applied_date': app.applied_at.strftime("%Y-%m-%d") if app.applied_at else "N/A"
                    })
                
                context_data = json.dumps(app_data, indent=2)
                return {
                    'action': 'llm_with_data',
                    'context': f"User's Application History:\n{context_data}",
                    'prompt_extension': f"Based on the Application History below, answer: '{user_prompt}'. Give specific status updates."
                }

    # --- Job Market Queries (Available to all) ---
    data_keywords = ['salary', 'compensation', 'pay', 'location', 'jobs', 'list', 'average', 'range', 'companies', 'all', 'hiring']
    context_keywords = ['job', 'role', 'position', 'company', 'developer', 'manager', 'engineer', 'analyst']
    
    if any(k in prompt_lower for k in data_keywords) and any(r in prompt_lower for r in context_keywords):
        jobs = Job.query.all() 
        
        if jobs:
            job_data = []
            for job in jobs:
                formatted_salary = format_salary(job.salary, job.type)
                job_data.append({
                    'title': job.title,
                    'company': job.company,
                    'salary': formatted_salary, 
                    'type': job.type,
                    'location': job.location
                })
                
            context_data = json.dumps(job_data, indent=2)
            return {
                'action': 'llm_with_data',
                'context': f"General Job Market Data:\n{context_data}",
                'prompt_extension': f"Based on the Job Market Data below, answer: '{user_prompt}'. Use the provided salary formats."
            }
            
    return {'action': 'llm_only'}