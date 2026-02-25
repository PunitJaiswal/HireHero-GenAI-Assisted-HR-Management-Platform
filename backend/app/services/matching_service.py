import spacy
import json
import re
from .llm_service import llm_service

class MatchingService:
    def __init__(self):
        try:
            print("Loading spaCy model...")
            # Ensure you have run: python -m spacy download en_core_web_md
            self.nlp = spacy.load("en_core_web_md")
            print("spaCy model loaded successfully.")
        except OSError:
            print("WARNING: 'en_core_web_md' model not found. Using blank model.")
            self.nlp = spacy.blank("en")

    def _clean_text(self, text):
        if not text:
            return ""
        # Keep essential chars for tech roles
        text = re.sub(r'[^a-zA-Z0-9\s\+\#\.\-]', ' ', text)
        return text.lower().strip()

    def _get_lemmas(self, text):
        """
        Extracts base forms of words (lemmas) to match 'Analyzing' with 'Analysis'.
        """
        doc = self.nlp(self._clean_text(text))
        # Filter out stop words, punctuation, and short junk
        return set([token.lemma_ for token in doc if not token.is_stop and not token.is_punct and len(token.text) > 2])

    def _construct_profile_text(self, profile):
        """
        Constructs a text representation of the candidate profile.
        Handles BOTH:
        1. A Database Model Object (Profile)
        2. A Dictionary (Parsed Resume Data)
        """
        text_parts = []

        # --- From Parsed Resume Dictionary ---
        if isinstance(profile, dict):
            # Skills
            if 'skills' in profile and isinstance(profile['skills'], list):
                skills_str = ", ".join(profile['skills'])
                text_parts.append(skills_str)

            # Experience
            if 'experience' in profile and isinstance(profile['experience'], list):
                for exp in profile['experience']:
                    title = exp.get('title', '')
                    company = exp.get('company', '')
                    desc = exp.get('description', '')
                    text_parts.append(f"{title} at {company}")
                    if desc:
                        text_parts.append(desc)

            # Education
            if 'education' in profile and isinstance(profile['education'], list):
                for edu in profile['education']:
                    degree = edu.get('degree', '')
                    inst = edu.get('institution', '')
                    text_parts.append(f"{degree} from {inst}")

            # Summary
            if 'summary' in profile and isinstance(profile['summary'], str):
                text_parts.append(profile['summary'])

        # --- From Profile Database Object ---
        elif profile:
            if hasattr(profile, 'skills') and profile.skills:
                skills_str = ", ".join(profile.skills)
                text_parts.append(skills_str)

            if hasattr(profile, 'experiences'):
                for exp in profile.experiences:
                    # Handle both dict-access or attribute-access if needed, usually attr for DB models
                    title = getattr(exp, 'title', '')
                    company = getattr(exp, 'company', '')
                    desc = getattr(exp, 'description', '')
                    text_parts.append(f"{title} at {company}")
                    if desc:
                        text_parts.append(desc)

            if hasattr(profile, 'educations'):
                for edu in profile.educations:
                    degree = getattr(edu, 'degree', '')
                    inst = getattr(edu, 'institution', '')
                    text_parts.append(f"{degree} from {inst}")

            if hasattr(profile, 'summary') and profile.summary:
                text_parts.append(profile.summary)

        return ". ".join(text_parts)

    def _construct_job_text_for_vector(self, job):
        """
        Constructs job text for Vector embedding (includes description).
        """
        text_parts = []
        text_parts.append(job.title)
        text_parts.append(job.title)

        if job.tags:
            tags_clean = job.tags.replace(',', ', ')
            text_parts.append(tags_clean)
            text_parts.append(tags_clean)

        if job.description:
            text_parts.append(job.description)

        return ". ".join(text_parts)

    def calculate_score(self, profile, job):
        try:
            if not self.nlp or not self.nlp.vocab:
                return 0.0

            # --- CORE KEYWORD MATCH (The "Hard" Skills) ---
            # We derive the "Must Haves" strictly from Job Title and Tags.
            # We ignore the description body for this part to avoid noise.

            job_core_text = f"{job.title} {job.title}" # Double weight on title
            if job.tags:
                job_core_text += f" {job.tags.replace(',', ' ')}"

            job_core_lemmas = self._get_lemmas(job_core_text)

            # Profile "Searchable" text
            profile_search_text = self._construct_profile_text(profile)
            profile_lemmas = self._get_lemmas(profile_search_text)

            # Calculate Overlap
            if not job_core_lemmas:
                keyword_score = 0.0
            else:
                intersection = job_core_lemmas.intersection(profile_lemmas)
                raw_overlap = len(intersection) / len(job_core_lemmas)

                # CURVE THE SCORE:
                # Matching 60% of tags is usually "Excellent". Matching 100% is rare.
                # We multiply by 1.5 to boost good candidates (e.g., 0.6 -> 0.9).
                keyword_score = min(raw_overlap * 1.5, 1.0)

            # --- SEMANTIC CONTEXT MATCH (The "Soft" Skills) ---
            # This uses the vectors to understand context (e.g. "Coding" ~ "Development")

            profile_vec_text = self._construct_profile_text(profile)
            job_vec_text = self._construct_job_text_for_vector(job) # Includes description

            # Safety check: ensure both texts are non-empty
            if not profile_vec_text or not job_vec_text:
                semantic_score = 0.0
                raw_semantic = 0.0
            else:
                doc_profile = self.nlp(self._clean_text(profile_vec_text[:100000]))
                doc_job = self.nlp(self._clean_text(job_vec_text[:100000]))

                raw_semantic = doc_profile.similarity(doc_job)

            # Normalize Vector Score:
            # Vectors are generous. 0.7 is a baseline for "Professional English".
            # We map 0.6 -> 0.0 and 0.95 -> 1.0
            semantic_score = max(0, (raw_semantic - 0.6) * 2.5)
            semantic_score = min(semantic_score, 1.0)

            # --- 3. FINAL WEIGHTED SCORE ---
            # If the candidate has the KEYWORDS, we trust them highly (65% weight).
            # The Vector context helps separate good resumes from keyword stuffing (35% weight).

            final_score = (keyword_score * 0.65) + (semantic_score * 0.35)

            # --- 4. ADJUSTMENTS ---

            # PENALTY: The "Nurse applying for SEO Specialist" case.
            # If they miss almost ALL core keywords, the semantic score is likely a hallucination/noise.
            if keyword_score < 0.2:
                final_score *= 0.4 # Crush the score.

            # BOOST: The "Expert" case.
            # If they matched > 80% of tags (after curve), they are definitely a strong fit.
            if keyword_score > 0.8:
                final_score = max(final_score, 0.85)

            return float(min(round(final_score * 100, 1), 98.0))

        except Exception as e:
            print(f"Error calculating score: {e}")
            return 0.0

    def parse_resume_with_llm(self, text):
        """
        Uses LLM to extract structured data while ignoring PII.
        """
        system_prompt = """
        You are an expert Resume Parser. Extract the following details from the resume text.
        Strictly exclude any Personal Identifiable Information (PII) like Name, Email, Phone.
        Return strict JSON:
        {
            "skills": ["List", "of", "skills"],
            "experience": [{"title": "...", "company": "...", "description": "..."}],
            "education": [{"degree": "...", "institution": "..."}],
            "summary": "Professional summary."
        }
        """
        try:
            response_text = llm_service.generate_text(system_prompt, f"Resume Text:\n{text[:10000]}")
            if "```" in response_text:
                response_text = response_text.replace("```json", "").replace("```", "")
            return json.loads(response_text)
        except Exception as e:
            print(f"LLM Parsing Error: {e}")
            return {}

    def generate_explanation(self, profile, job, score):
        # Using the same construction logic as calculation for consistency
        profile_text = self._construct_profile_text(profile)
        job_text = self._construct_job_text_for_vector(job)

        system_prompt = f"""
        You are an expert HR Recruiter.
        Compare the candidate profile and the job description.
        The calculated match score is {score}/100.

        Provide a strict JSON response (no markdown) with:
        - "strengths": List of anywhere between 0 to 4 matching skills or experiences (if score is high, then more points here).
        - "missing": List of anywhere between 0 to 4 key requirements missing from the profile (if score is low, then more points here).
        - "verdict": A 1-sentence summary of why this score was given.
        """

        user_prompt = f"CANDIDATE PROFILE:\n{profile_text[:3000]}\n\nJOB DESCRIPTION:\n{job_text[:3000]}"

        try:
            response_text = llm_service.generate_text(system_prompt, user_prompt)
            if "```" in response_text:
                response_text = response_text.replace("```json", "").replace("```", "")
            return response_text
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return json.dumps({
                "strengths": ["Analysis failed"],
                "missing": ["Analysis failed"],
                "verdict": "Could not generate explanation."
            })

matching_service = MatchingService()