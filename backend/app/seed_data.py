from .database import db
from .models import User, Profile, Job, Application, Employee, Performance, Education, Experience, Interview
from .services.matching_service import matching_service
from datetime import datetime, timedelta
import random
import csv
import os

def seed_database():
    """
    Clears the database and repopulates it with rich, context-aware dummy data.
    """
    print("--- Clearing existing data ---")
    db.drop_all()
    db.create_all()
    print("--- Database cleared ---")

    print("--- Seeding with Rich Contextual Data ---")
    
    # --- Data Lists ---
    male_names = [
        "Aarav", "Vihaan", "Aditya", "Arjun", "Sai", "Reyansh", "Rahul", "Amit", 
        "Vikram", "Rohan", "Karthik", "Siddharth", "Manish", "Varun", "Nikhil", 
        "Pranav", "Ishaan", "Dhruv", "Krishna", "Om"
    ]
    female_names = [
        "Diya", "Saanvi", "Ananya", "Aadhya", "Pari", "Priya", "Neha", "Sneha", 
        "Anjali", "Kavya", "Isha", "Meera", "Riya", "Pooja", "Aditi", "Nisha", 
        "Kriti", "Tanvi", "Shruti", "Radha"
    ]
    last_names = [
        "Kumar", "Sharma", "Patel", "Singh", "Das", "Nair", "Reddy", "Gupta", 
        "Mishra", "Joshi", "Chopra", "Desai", "Mehta", "Iyer", "Verma", "Rao", 
        "Saxena", "Malhotra", "Bhatia", "Kapoor"
    ]
    
    locations = [
        "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", 
        "Gurgaon", "Noida", "Kolkata", "Ahmedabad"
    ]

    company_names = [
        "TechNova Solutions", "Global Corp", "Innovate Inc", "Apex Systems", 
        "CloudWalkers", "DataMinds", "HealthPlus", "FinServe", "Creative Hive", "SoftSynergy"
    ]
    
    universities = [
        "IIT Bombay", "IIT Delhi", "BITS Pilani", "Anna University", 
        "University of Mumbai", "Delhi University", "VIT Vellore", 
        "Manipal Institute of Technology", "SRM University", "Amity University"
    ]

    schools = [
        "Delhi Public School", "Kendriya Vidyalaya", "National Public School", 
        "The Doon School", "Mayo College", "St. Xavier's High School", 
        "DAV Public School", "Ryan International School", "Army Public School"
    ]

    hs_descriptions = [
        "Completed Senior Secondary education with a focus on Physics, Chemistry, and Mathematics (PCM). Achieved an aggregate score of 95% in the board examinations.",
        "Graduated High School with honors in the Commerce stream. Served as the School Prefect and organized various cultural and sports events."
    ]

    # --- Performance Reviews Pool (Context-Aware) ---
    # Format: (Min Rating, Max Rating, Comment)
    performance_reviews = {
        "Software Engineering": [
            (4.5, 5.0, "Exceptional code quality and system design skills. Consistently delivers features ahead of schedule and mentors junior developers effectively."),
            (4.0, 4.5, "Strong problem-solving abilities. Delivered the API migration project with zero downtime. Documentation could be slightly more detailed."),
            (3.0, 3.8, "Good technical skills but needs to improve on sprint estimation accuracy. Code reviews are sometimes delayed."),
            (2.5, 3.0, "Struggles with meeting deadlines on complex tasks. Code often requires multiple rounds of refactoring.")
        ],
        "Data Science": [
            (4.7, 5.0, "Developed a predictive model that improved customer retention by 15%. Outstanding analytical skills and business insight."),
            (4.0, 4.6, "Very proficient in Python and SQL. The data visualization dashboard was well-received by stakeholders."),
            (3.0, 3.5, "Good at model building but needs to focus more on model deployment and scalability aspects."),
            (2.0, 3.0, "Analysis often lacks depth. Needs to improve understanding of the core business metrics.")
        ],
        "Healthcare": [
            (4.8, 5.0, "Demonstrates exceptional patient care and empathy. Clinical diagnoses are accurate, and patient feedback is consistently positive."),
            (4.2, 4.7, "Maintains high standards of hygiene and protocol adherence. Very reliable during high-pressure shifts."),
            (3.2, 3.8, "Competent in clinical procedures but communication with patients' families needs improvement."),
            (2.5, 3.0, "Has missed several protocol updates. Needs to be more attentive to patient charts.")
        ],
        "Pharmacy": [
            (4.6, 5.0, "Meticulous attention to detail in dispensing medications. Detected a critical drug interaction that saved a patient from complications."),
            (4.0, 4.5, "Efficient inventory management. Always ensures essential stocks are available. excellent customer service skills."),
            (3.0, 3.5, "Generally accurate but prescription processing speed during peak hours needs improvement."),
            (2.5, 2.9, "Occasional errors in stock counting. Needs to focus more during inventory audits.")
        ],
        "Digital Marketing": [
            (4.7, 5.0, "The recent SEO campaign increased organic traffic by 40%. creative content strategy is driving significant engagement."),
            (4.0, 4.5, "Great management of PPC budgets. ROI has improved consistently over the last quarter."),
            (3.0, 3.6, "Social media posts are good but posting consistency has been irregular. Needs better calendar planning."),
            (2.0, 2.8, "Campaign analysis reports are often late and lack actionable insights.")
        ],
        "Public Relations": [
            (4.8, 5.0, "Excellent crisis management during the recent product recall. Maintained positive media relations throughout."),
            (4.0, 4.5, "Strong network of media contacts. Successfully placed our story in three major national publications."),
            (3.0, 3.5, "Press releases are well-written but distribution timing needs better coordination with product launches."),
            (2.5, 3.0, "Struggles to adapt messaging for different social channels.")
        ],
        "Legal": [
            (4.9, 5.0, "Masterful negotiation on the merger deal. Protected company interests while ensuring a smooth closing."),
            (4.2, 4.8, "Very thorough in contract review. Identified potential liability risks that were previously overlooked."),
            (3.5, 3.9, "Solid legal research skills, but turnaround time on drafting agreements needs to be faster."),
            (2.8, 3.2, "Needs to be more proactive in updating the team on regulatory changes.")
        ],
        "Corporate Compliance": [
            (4.7, 5.0, "Revamped the internal audit process, significantly reducing compliance risks. flawless execution."),
            (4.0, 4.5, " diligent in risk assessment. Training sessions conducted for staff were very effective."),
            (3.0, 3.5, "Good understanding of regulations, but internal policy documentation is often delayed."),
            (2.5, 3.0, "Missed a key update in local compliance laws. Needs to stay more current.")
        ],
        "Finance": [
            (4.8, 5.0, "Financial models for the Q3 forecast were incredibly accurate. Strategic insights helped secure investor funding."),
            (4.2, 4.6, "Excellent analysis of market trends. Investment recommendations have outperformed the benchmark."),
            (3.2, 3.8, "Strong Excel skills, but presentation of data to non-financial stakeholders needs simplification."),
            (2.5, 3.0, "Errors found in the monthly valuation report. Attention to detail is crucial.")
        ],
        "Accounting": [
            (4.9, 5.0, "Managed the year-end audit flawlessly. No discrepancies found. Highly organized and efficient."),
            (4.1, 4.7, "Streamlined the accounts payable process, reducing processing time by 20%. Great initiative."),
            (3.5, 4.0, "Reliable with day-to-day bookkeeping, but struggles with complex tax reconciliation tasks."),
            (2.8, 3.2, "Month-end close process is consistently delayed. Needs better time management.")
        ]
    }

    # --- 10 Field Definitions (Grouped by Similarity) ---
    fields_config = [
        # Group A: Tech (Remote Friendly, High Pay)
        {
            "name": "Software Engineering",
            "company": "TechNova Solutions",
            "jobs": ["Senior Full Stack Developer", "DevOps Engineer"],
            "skills": ["Python", "JavaScript", "React", "AWS", "SQL", "Git", "APIs", "Data Integration", "Backend Development", "System Design"],
            "degrees": ["B.Tech in Computer Science", "M.S. in Software Engineering"],
            "summaries": ["Full Stack Developer with expertise in building scalable web apps and integrating data-driven backends using Python and SQL.", "DevOps Engineer skilled in cloud infrastructure (AWS) and automating data pipelines for production systems."],
            "salary_range": (1200000, 4500000),
            "remote_allowed": True
        },
        {
            "name": "Data Science",
            "company": "TechNova Solutions",
            "jobs": ["Data Scientist", "Machine Learning Engineer"],
            "skills": ["Python", "SQL", "Machine Learning", "Pandas", "AWS", "Git", "APIs", "Data Analysis", "Model Deployment", "Software Engineering"],
            "degrees": ["M.S. in Data Science", "B.Tech in Computer Science"],
            "summaries": ["Data Scientist with strong software engineering fundamentals. Experienced in building production-ready models and APIs using Python.", "Machine Learning Engineer focused on deploying scalable AI solutions on AWS. Proficient in Python, SQL, and system design."],
            "salary_range": (1400000, 4800000),
            "remote_allowed": True
        },
        # Group C: Medical (On-site Only, Moderate Pay)
        {
            "name": "Healthcare",
            "company": "City General Hospital",
            "jobs": ["Nurse Practitioner", "Medical Assistant"],
            "skills": ["Patient Counseling", "Pharmacology", "Medication Administration", "Vital Signs", "Medical Terminology", "EHR", "Inventory Management", "Biology", "Dosage Calculations"],
            "degrees": ["Master of Science in Nursing", "Medical Assistant Diploma"],
            "summaries": ["Experienced Nurse Practitioner with a strong background in pharmacology and patient counseling. Skilled in managing medication therapies.", "Certified Medical Assistant proficient in medication administration and inventory management. Dedicated to patient care."],
            "salary_range": (400000, 1200000),
            "remote_allowed": False
        },
        {
            "name": "Pharmacy",
            "company": "City General Hospital",
            "jobs": ["Pharmacist", "Pharmacy Technician"],
            "skills": ["Pharmacology", "Medication Dispensing", "Patient Counseling", "Pharmacy Law", "Drug Interactions", "Inventory Management", "Calculations", "Biology"],
            "degrees": ["Doctor of Pharmacy (Pharm.D.)", "Pharmacy Technician Certification"],
            "summaries": ["Licensed Pharmacist with a focus on patient safety and medication therapy management. Strong knowledge of drug interactions.", "Certified Pharmacy Technician with experience in retail and hospital settings. Efficient and organized."],
            "salary_range": (350000, 1500000),
            "remote_allowed": False
        },
        # Group D: Marketing (Hybrid Friendly, Medium Pay)
        {
            "name": "Digital Marketing",
            "company": "GrowthHive Agency",
            "jobs": ["Digital Marketing Manager", "SEO Specialist"],
            "skills": ["SEO", "SEM", "Google Analytics", "Content Marketing", "Social Media Management", "Copywriting", "Email Marketing", "PPC"],
            "degrees": ["B.A. in Marketing", "Master's in Digital Communications"],
            "summaries": ["Results-driven Digital Marketing Manager with a focus on growth strategies and brand development. Expert in SEO and PPC.", "Creative SEO Specialist with a knack for optimizing web content and improving organic search rankings."],
            "salary_range": (600000, 2000000),
            "remote_allowed": True
        },
        {
            "name": "Public Relations",
            "company": "GrowthHive Agency",
            "jobs": ["Public Relations Manager", "Content Strategist"],
            "skills": ["Public Relations", "Media Relations", "Press Releases", "Content Strategy", "Crisis Management", "Communications", "Social Media", "Writing"],
            "degrees": ["B.A. in Public Relations", "B.A. in Communications"],
            "summaries": ["Strategic Public Relations Manager with a proven track record of managing media relations and corporate communications.", "Content Strategist passionate about storytelling and brand messaging. Experienced in creating engaging content."],
            "salary_range": (700000, 2200000),
            "remote_allowed": True
        },
        # Group E: Legal (Hybrid, High Pay)
        {
            "name": "Legal",
            "company": "Vanguard Law Firm",
            "jobs": ["Corporate Attorney", "Legal Paralegal"],
            "skills": ["Corporate Law", "Contract Negotiation", "Legal Research", "Litigation Support", "Compliance", "Drafting", "Case Management"],
            "degrees": ["Juris Doctor (J.D.)", "Paralegal Certificate"],
            "summaries": ["Experienced Corporate Attorney specializing in mergers and acquisitions. Strong negotiator with a deep understanding of business law.", "Detail-oriented Paralegal with strong organizational skills and experience in legal research and document preparation."],
            "salary_range": (1000000, 4000000),
            "remote_allowed": True
        },
        {
            "name": "Corporate Compliance",
            "company": "Vanguard Law Firm",
            "jobs": ["Compliance Officer", "Risk Manager"],
            "skills": ["Compliance", "Risk Management", "Auditing", "Regulations", "Policy Development", "Legal Research", "Analysis", "Corporate Law"],
            "degrees": ["Master's in Business Law", "B.S. in Business Administration"],
            "summaries": ["Compliance Officer dedicated to ensuring organizational adherence to laws and regulations. Strong background in risk assessment.", "Risk Manager with experience in identifying and mitigating business risks. Skilled in developing control systems."],
            "salary_range": (900000, 3000000),
            "remote_allowed": True
        },
        # Group F: Finance (Hybrid, High Pay)
        {
            "name": "Finance",
            "company": "Summit Capital",
            "jobs": ["Investment Banker", "Financial Analyst"],
            "skills": ["Financial Modeling", "Valuation", "Excel", "Data Analysis", "Accounting", "Risk Management", "Investment Banking", "Reporting"],
            "degrees": ["MBA in Finance", "B.S. in Economics"],
            "summaries": ["Ambitious Investment Banker with expertise in financial modeling and valuation. Proven ability to analyze complex market data.", "Analytical Financial Analyst with a strong background in budgeting and forecasting. Skilled in providing actionable insights."],
            "salary_range": (1000000, 4200000),
            "remote_allowed": True
        },
        {
            "name": "Accounting",
            "company": "Summit Capital",
            "jobs": ["Senior Accountant", "Tax Consultant"],
            "skills": ["Accounting", "GAAP", "Taxation", "Financial Reporting", "Auditing", "Excel", "Bookkeeping", "Compliance"],
            "degrees": ["B.S. in Accounting", "CPA Certification"],
            "summaries": ["Senior Accountant with a thorough knowledge of GAAP and financial reporting. Experienced in managing month-end close processes.", "Tax Consultant with expertise in tax planning and compliance. Dedicated to minimizing tax liabilities for clients."],
            "salary_range": (800000, 2800000),
            "remote_allowed": True
        }
    ]

    # --- Job Description Generator ---
    def generate_job_description(title, company, dept):
        csv_path = os.path.join(os.path.dirname(__file__), 'job_descriptions.csv')
        description_map = {}
        try:
            with open(csv_path, mode='r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    description_map[row['title'].strip()] = row['description'].strip()
        except FileNotFoundError:
            print(f"Warning: {csv_path} not found.")

        specific_desc = description_map.get(title, f"We are looking for a {title} to join our {dept} team.")
        
        return f"""
{specific_desc}

Company Culture:
At {company}, we foster a culture of innovation and collaboration. We believe in empowering our employees to take ownership of their work.
"""

    # --- Helper: Create User ---
    def create_user(email, first, last, role, company=None):
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                first_name=first,
                last_name=last,
                email=email,
                role=role,
                company_name=company
            )
            user.set_password("123") 
            db.session.add(user)
            db.session.commit()
            print(f"  [+] Created {role}: {first} {last} ({email})")
        return user

    # --- Helper: Generate Phone ---
    def gen_phone():
        return f"{random.choice(['9', '8', '7'])}{random.randint(100000000, 999999999)}"

    # --- Helper: Generate Context-Aware Salary ---
    def gen_salary(emp_type, min_annual, max_annual):
        if emp_type == "Internship":
            # Interns get a fraction
            return str(random.randint(15, 40) * 1000 * 12) 
        elif emp_type == "Part-Time":
            # ~40-60% of full time
            return str(random.randint(int(min_annual * 0.4), int(max_annual * 0.4)))
        else: # Full-Time or Contract
            return str(random.randint(min_annual, max_annual))

    # --- 1. Create HR Users (5) ---
    print("\n--- Seeding HR Users ---")
    hr_users = []
    
    hr_names = [
        ("Vikram", "Malhotra"), ("Anjali", "Desai"), ("Rohan", "Mehta"), 
        ("Priya", "Iyer"), ("Siddharth", "Reddy")
    ]

    for i in range(5):
        field_primary = fields_config[i * 2]
        field_similar = fields_config[i * 2 + 1]
        
        fname, lname = hr_names[i]
        email = f"hr{i+1}@gmail.com" 
        
        hr = create_user(email, fname, lname, "hr", field_primary["company"])
        hr_users.append((hr, [field_primary, field_similar]))
        
        if not hr.profile:
            profile = Profile(
                user_id=hr.id,
                phone=gen_phone(),
                location=random.choice(locations),
                summary=f"HR Head at {field_primary['company']}.",
                profile_pic=f"/uploads/{'woman.png' if (i%2!=0) else 'man.png'}",
            )
            db.session.add(profile)
    db.session.commit()

    # --- 2. Create Employees (5 per HR = 25 total) ---
    print("\n--- Seeding Employees ---")
    emp_counter = 1
    
    for hr_user, assigned_fields in hr_users:
        # Create 5 employees for this specific HR
        for k in range(5):
            full_name = random.choice(male_names + female_names)
            is_female = full_name in female_names
            fname = full_name
            lname = random.choice(last_names)
            email = f"employee{emp_counter}@gmail.com"
            
            field_data = random.choice(assigned_fields)
            
            # Employment Type Logic
            if k < 2:
                emp_type = "Full-Time"
            else:
                emp_type = random.choice(["Full-Time", "Part-Time", "Contract", "Internship"])
            
            emp_user = create_user(email, fname, lname, "employee")
            
            emp_location = random.choice(locations)

            if not emp_user.profile:
                profile = Profile(
                    user_id=emp_user.id,
                    phone=gen_phone(),
                    location=emp_location,
                    summary=f"Employee at {field_data['company']}.",
                    profile_pic=f"/uploads/{'woman.png' if is_female else 'man.png'}"
                )
                db.session.add(profile)
                db.session.flush()

            if not emp_user.employee:
                # Randomize employee job location based on field allowed types
                if field_data["remote_allowed"]:
                    loc_type = random.choice(["On-site", "Hybrid", "Remote"])
                else:
                    loc_type = "On-site"

                if loc_type == "On-site":
                    job_loc = emp_location
                elif loc_type == "Hybrid":
                    job_loc = f"Hybrid ({emp_location})"
                else:
                    job_loc = "Remote"

                min_sal, max_sal = field_data["salary_range"]

                emp = Employee(
                    user_id=emp_user.id,
                    job_title=random.choice(field_data["jobs"]),
                    department=field_data["name"],
                    job_location=job_loc,
                    employment_type=emp_type,
                    salary=gen_salary(emp_type, min_sal, max_sal),
                    hired_at=datetime.utcnow() - timedelta(days=random.randint(30, 1000)),
                    photo=f"/uploads/{'woman.png' if is_female else 'man.png'}",
                    hired_by=hr_user.id
                )
                db.session.add(emp)
                db.session.commit()
                
                # --- CONTEXT-AWARE PERFORMANCE SEEDING ---
                dept_name = field_data["name"]
                review_pool = performance_reviews.get(dept_name, performance_reviews["Software Engineering"]) # Fallback

                for _ in range(random.randint(1, 4)):
                    review_date = datetime.utcnow() - timedelta(days=random.randint(1, 365))
                    
                    # Pick a random template and generate a score within its range
                    min_r, max_r, comment_text = random.choice(review_pool)
                    rating = round(random.uniform(min_r, max_r), 1)
                    
                    perf = Performance(
                        employee_id=emp.id,
                        rating=rating,
                        comments=comment_text,
                        date=review_date
                    )
                    db.session.add(perf)
            
            emp_counter += 1

    db.session.commit()

    # --- 3. Create Jobs (10) ---
    print("\n--- Seeding Jobs ---")
    all_jobs = []
    
    # Options for randomized job fields
    job_types = ["Full-Time", "Part-Time", "Contract", "Internship"]
    exp_levels = ["Junior", "Mid", "Senior", "Lead"]
    edu_reqs = ["Bachelor's", "Master's", "PhD"]
    benefit_opts = ["Health Insurance", "Paid Leave", "Gym Membership", "Stock Options"]

    for hr, assigned_fields in hr_users:
        for field_data in assigned_fields:
            title = field_data["jobs"][0]
            
            # Select Benefits (Include Remote Work only if allowed)
            current_benefits = random.sample(benefit_opts, k=random.randint(2, 3))
            if field_data["remote_allowed"]:
                current_benefits.append("Remote Work")
            
            job_benefits = ",".join(current_benefits)
            
            # Location & Remote Option Logic
            job_loc_city = random.choice(locations)
            
            if field_data["remote_allowed"]:
                rem_opt = random.choice(["Remote", "Hybrid", "On-site"])
            else:
                rem_opt = "On-site"

            if rem_opt == "Remote":
                job_loc = "Remote"
            else:
                job_loc = job_loc_city
            
            selected_job_type = random.choice(job_types)
            min_sal, max_sal = field_data["salary_range"]

            # Backdate the Job Posting
            job_posted_date = datetime.utcnow() - timedelta(days=random.randint(30, 60))

            job = Job(
                title=title,
                company=field_data["company"],
                department=field_data["name"],
                description=generate_job_description(title, field_data["company"], field_data["name"]),
                location=job_loc,
                type=selected_job_type,
                remote_option=rem_opt,
                experience_level=random.choice(exp_levels),
                education=random.choice(edu_reqs),
                salary=gen_salary(selected_job_type, min_sal, max_sal),
                tags=",".join(field_data["skills"][:5]),
                benefits=job_benefits,
                application_deadline=(datetime.utcnow() + timedelta(days=random.randint(10, 60))).strftime('%Y-%m-%d'),
                posted_by=hr.id,
                created_at=job_posted_date
            )
            db.session.add(job)
            all_jobs.append(job)
            
    db.session.commit()
    print(f"  [+] Created {len(all_jobs)} Job Listings")

    # --- 4. Create Job Seekers (20) ---
    print("\n--- Seeding Job Seekers ---")
    seekers = []
    seeker_names = (male_names + female_names)[:20]
    
    for i in range(20):
        # Force JS1 to be Software Engineer (Index 0 in fields_config)
        if i == 0:
            field_idx = 0 
        else:
            field_idx = i % 10
            
        field_data = fields_config[field_idx]
        
        full_name = seeker_names[i]
        is_female = full_name in female_names
        fname = full_name
        lname = random.choice(last_names)
        email = f"js{i+1}@gmail.com"
        
        seeker = create_user(email, fname, lname, "candidate")
        seekers.append((seeker, field_data)) 
        
        if not seeker.profile:
            pic = f"/uploads/{'woman.png' if is_female else 'man.png'}"
            skills_str = ", ".join(field_data["skills"])
            summary_text = f"{random.choice(field_data['summaries'])}\n\nCore Skills: {skills_str}"
            
            phone_num = gen_phone()
            loc = random.choice(locations)

            profile = Profile(
                user_id=seeker.id,
                phone=phone_num,
                location=loc,
                summary=summary_text,
                completeness=80,
                profile_pic=pic,
                views=random.randint(2, 15)
            )
            db.session.add(profile)
            db.session.flush()

            # Education
            uni_start = datetime.utcnow() - timedelta(days=2000)
            uni_end = datetime.utcnow() - timedelta(days=600)
            edu_uni = Education(
                profile_id=profile.id,
                degree=random.choice(field_data["degrees"]),
                institution=random.choice(universities),
                start_date=uni_start,
                end_date=uni_end,
                description=f"Specialized in {field_data['name']} studies."
            )
            db.session.add(edu_uni)

            # High School
            hs_end = uni_start - timedelta(days=90)
            hs_start = hs_end - timedelta(days=730)
            edu_hs = Education(
                profile_id=profile.id,
                degree="Senior Secondary (Class XII)",
                institution=random.choice(schools),
                start_date=hs_start,
                end_date=hs_end,
                description=random.choice(hs_descriptions)
            )
            db.session.add(edu_hs)

            # Experience
            exp = Experience(
                profile_id=profile.id,
                title=field_data["jobs"][0],
                company=random.choice(company_names),
                start_date=datetime.utcnow() - timedelta(days=500),
                end_date=None,
                description=f"Working as a key member of the team in {field_data['name']} domain. Leveraging skills in {skills_str[:50]}..."
            )
            db.session.add(exp)

    db.session.commit()

    # --- 5. Create Applications & Interviews ---
    print("\n--- Seeding Applications ---")
    
    # Track interviews per HR
    hr_interview_counts = {hr.id: 0 for hr, _ in hr_users}
    js1_has_interview = False

    for seeker, expert_field_data in seekers:
        expert_dept = expert_field_data["name"]
        
        idx = -1
        for k, f in enumerate(fields_config):
            if f["name"] == expert_dept:
                idx = k
                break
        
        similar_idx = idx + 1 if idx % 2 == 0 else idx - 1
        similar_dept = fields_config[similar_idx]["name"]
        
        high_jobs = [j for j in all_jobs if j.department == expert_dept]
        med_jobs = [j for j in all_jobs if j.department == similar_dept]
        low_jobs = [j for j in all_jobs if j.department != expert_dept and j.department != similar_dept]
        
        target_jobs = []
        if high_jobs: target_jobs.append(random.choice(high_jobs))
        if med_jobs: target_jobs.append(random.choice(med_jobs))
        if low_jobs: target_jobs.append(random.choice(low_jobs))
            
        for job in target_jobs:
            if not Application.query.filter_by(user_id=seeker.id, job_id=job.id).first():
                
                score = 0.0
                try:
                    score = matching_service.calculate_score(seeker.profile, job)
                except Exception as e:
                    print(f"Error calculating score: {e}")
                
                # --- Context-Aware Status Logic ---
                if score >= 85:
                    status = random.choice(['interviewing', 'offer_extended', 'accepted'])
                elif score >= 60:
                    status = random.choice(['applied', 'interviewing', 'under_review'])
                else: # Score < 60
                    status = random.choice(['applied', 'rejected'])

                # Force JS1 to have an interview if not already
                if seeker.email == "js1@gmail.com" and not js1_has_interview and status != 'rejected':
                    status = 'interviewing'
                    js1_has_interview = True

                days_since_post = (datetime.utcnow() - job.created_at).days
                if days_since_post < 1: days_since_post = 1
                
                application_date = job.created_at + timedelta(days=random.randint(0, days_since_post))

                app = Application(
                    user_id=seeker.id,
                    job_id=job.id,
                    status=status,
                    applied_at=application_date,
                    match_score=score,
                    match_explanation=None
                )
                db.session.add(app)
                db.session.flush()
                
                if status == 'interviewing':
                    # Determine Interview Type based on Department
                    is_medical = job.department in ["Healthcare", "Pharmacy"]
                    
                    if is_medical:
                        int_type = "in_person"
                        int_detail = "City General Hospital, Main Wing, Room 302"
                    else:
                        int_type = random.choices(["video", "phone", "in_person"], weights=[70, 15, 15])[0]
                        if int_type == "video":
                            int_detail = "https://meet.google.com/abc-defg-hij"
                        elif int_type == "phone":
                            int_detail = "+91 98765 43210"
                        else:
                            int_detail = f"{job.company} HQ, Conf Room A"

                    # Future Interview Date
                    interview_date = datetime.utcnow() + timedelta(days=random.randint(2, 14))
                    
                    interview = Interview(
                        application_id=app.id,
                        stage="Technical Round" if not is_medical else "Clinical Assessment",
                        scheduled_at=interview_date,
                        location_type=int_type,
                        location_detail=int_detail
                    )
                    db.session.add(interview)
                    hr_interview_counts[job.posted_by] += 1

    db.session.commit()

    # --- 6. Post-Seeding Guarantee: At least 1 Interview per HR ---
    print("--- Verifying Interview Coverage ---")
    for hr, _ in hr_users:
        if hr_interview_counts[hr.id] == 0:
            hr_job = Job.query.filter_by(posted_by=hr.id).first()
            if hr_job:
                app = Application.query.filter_by(job_id=hr_job.id).first()
                if not app:
                    dummy_seeker = create_user(f"dummy_cand_{hr.id}@gmail.com", "Dummy", "Candidate", "candidate")
                    app = Application(user_id=dummy_seeker.id, job_id=hr_job.id, status='interviewing', match_score=75.0)
                    db.session.add(app)
                    db.session.flush()
                
                app.status = 'interviewing'
                
                is_medical = hr_job.department in ["Healthcare", "Pharmacy"]
                if is_medical:
                    int_type = "in_person"
                    int_detail = "City General Hospital, Main Wing, Room 302"
                else:
                    int_type = "video"
                    int_detail = "https://meet.google.com/priority-interview"

                interview = Interview(
                    application_id=app.id,
                    stage="Priority Interview",
                    scheduled_at=datetime.utcnow() + timedelta(days=3),
                    location_type=int_type,
                    location_detail=int_detail
                )
                db.session.add(interview)
    
    # --- 7. Post-Seeding Guarantee: Exactly 1 Hired per HR ---
    print("--- Setting exactly one 'Hired' per HR ---")
    for hr, _ in hr_users:
        # Get all apps for this HR's jobs
        hr_jobs = Job.query.filter_by(posted_by=hr.id).all()
        hr_job_ids = [j.id for j in hr_jobs]
        
        apps = Application.query.filter(Application.job_id.in_(hr_job_ids)).all()
        
        # Reset any accidental hires from random logic to 'offer_extended' first
        # to ensure exactly one hired per HR.
        for app in apps:
            if app.status == 'hired':
                app.status = 'offer_extended'
        
        # Priority 1: Pick a candidate with High Match Score (80%+) who is not currently interviewing
        candidates_pool = [a for a in apps if a.status != 'interviewing' and a.match_score >= 80]
        
        # Priority 2: If none found, pick ANY candidate (not interviewing)
        if not candidates_pool:
            candidates_pool = [a for a in apps if a.status != 'interviewing']
        
        if candidates_pool:
            winner = random.choice(candidates_pool)
            winner.status = 'hired'
            
            # FORCE score to be high if it wasn't already (Ensures the 80%+ requirement)
            if winner.match_score < 80:
                winner.match_score = round(random.uniform(80.0, 95.0), 1)
                
            print(f"  [+] HR {hr.email} hired Applicant {winner.user_id} for Job {winner.job_id} (Score: {winner.match_score})")

    db.session.commit()

    print("--- Database Seed Complete ---")
    print("DEMO CREDENTIALS:")
    print("  HR (Software/Data): hr1@gmail.com / 123")
    print("  JS (Software Engineer): js1@gmail.com / 123")