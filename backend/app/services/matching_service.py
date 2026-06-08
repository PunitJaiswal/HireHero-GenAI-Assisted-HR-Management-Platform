import re
import json
import math
from collections import Counter
from .llm_service import llm_service

# Common English stop words for professional text
STOP_WORDS = {
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'i', 'you', 'he',
    'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those', 'my',
    'your', 'his', 'her', 'its', 'our', 'their', 'as', 'not', 'no', 'nor',
    'so', 'yet', 'both', 'either', 'each', 'more', 'most', 'other', 'some',
    'such', 'than', 'too', 'very', 'just', 'about', 'above', 'after',
    'before', 'during', 'through', 'up', 'down', 'out', 'off', 'over',
    'under', 'again', 'then', 'once', 'here', 'there', 'when', 'where',
    'how', 'all', 'any', 'much', 'own', 'same', 'few', 'into', 'also',
    'what', 'which', 'who', 'whom', 'if', 'while', 'although', 'because',
    'since', 'unless', 'until', 'though', 'like', 'including', 'across',
    'among', 'between', 'per', 'vs', 'etc', 'ie', 'eg', 'am', 'us'
}

# Common suffixes for lightweight stemming
SUFFIXES = [
    'ations', 'ation', 'ating', 'ments', 'ment', 'nesses', 'ness',
    'ities', 'ity', 'ings', 'ing', 'tions', 'tion', 'ions', 'ion',
    'ers', 'er', 'ous', 'ive', 'ful', 'able', 'ible', 'less',
    'ally', 'ely', 'ly', 'al', 'ed', 'es', 'en'
]


def _simple_stem(word):
    """Strip common suffixes to get a root form."""
    if len(word) <= 4:
        return word
    for suffix in SUFFIXES:
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            return word[:-len(suffix)]
    return word


def _tokenize_and_stem(text):
    """Tokenize, remove stop words, and stem."""
    text = re.sub(r'[^a-zA-Z0-9\s\+\#\.\-]', ' ', text.lower())
    tokens = text.split()
    return set([
        _simple_stem(token)
        for token in tokens
        if token not in STOP_WORDS and len(token) > 2 and not token.isdigit()
    ])


def _cosine_similarity(text1, text2):
    """Compute TF-based cosine similarity between two texts."""
    tokens1 = re.sub(r'[^a-zA-Z0-9\s]', ' ', text1.lower()).split()
    tokens2 = re.sub(r'[^a-zA-Z0-9\s]', ' ', text2.lower()).split()

    freq1 = Counter(
        _simple_stem(t) for t in tokens1
        if t not in STOP_WORDS and len(t) > 2 and not t.isdigit()
    )
    freq2 = Counter(
        _simple_stem(t) for t in tokens2
        if t not in STOP_WORDS and len(t) > 2 and not t.isdigit()
    )

    if not freq1 or not freq2:
        return 0.0

    all_words = set(freq1.keys()) | set(freq2.keys())
    dot_product = sum(freq1.get(w, 0) * freq2.get(w, 0) for w in all_words)
    mag1 = math.sqrt(sum(v * v for v in freq1.values()))
    mag2 = math.sqrt(sum(v * v for v in freq2.values()))

    if mag1 == 0 or mag2 == 0:
        return 0.0

    return dot_product / (mag1 * mag2)


class MatchingService:
    def __init__(self):
        print("MatchingService initialized (pure-Python NLP, no spaCy required).")

    def _clean_text(self, text):
        if not text:
            return ""
        text = re.sub(r'[^a-zA-Z0-9\s\+\#\.\-]', ' ', text)
        return text.lower().strip()

    def _get_stems(self, text):
        """Extract stemmed, filtered tokens from text."""
        return _tokenize_and_stem(text)

    def _construct_profile_text(self, profile):
        """Build a text blob from a Profile DB object or a parsed resume dict."""
        text_parts = []

        if isinstance(profile, dict):
            if 'skills' in profile and isinstance(profile['skills'], list):
                text_parts.append(", ".join(profile['skills']))
            if 'experience' in profile and isinstance(profile['experience'], list):
                for exp in profile['experience']:
                    title = exp.get('title', '')
                    company = exp.get('company', '')
                    desc = exp.get('description', '')
                    text_parts.append(f"{title} at {company}")
                    if desc:
                        text_parts.append(desc)
            if 'education' in profile and isinstance(profile['education'], list):
                for edu in profile['education']:
                    text_parts.append(f"{edu.get('degree', '')} from {edu.get('institution', '')}")
            if 'summary' in profile and isinstance(profile['summary'], str):
                text_parts.append(profile['summary'])

        elif profile:
            if hasattr(profile, 'skills') and profile.skills:
                text_parts.append(", ".join(profile.skills))
            if hasattr(profile, 'experiences'):
                for exp in profile.experiences:
                    title = getattr(exp, 'title', '')
                    company = getattr(exp, 'company', '')
                    desc = getattr(exp, 'description', '')
                    text_parts.append(f"{title} at {company}")
                    if desc:
                        text_parts.append(desc)
            if hasattr(profile, 'educations'):
                for edu in profile.educations:
                    text_parts.append(
                        f"{getattr(edu, 'degree', '')} from {getattr(edu, 'institution', '')}"
                    )
            if hasattr(profile, 'summary') and profile.summary:
                text_parts.append(profile.summary)

        return ". ".join(text_parts)

    def _construct_job_text_for_vector(self, job):
        """Build job text for similarity comparison (includes description)."""
        text_parts = [job.title, job.title]
        if job.tags:
            tags_clean = job.tags.replace(',', ', ')
            text_parts.append(tags_clean)
            text_parts.append(tags_clean)
        if job.description:
            text_parts.append(job.description)
        return ". ".join(text_parts)

    def calculate_score(self, profile, job):
        try:
            # --- KEYWORD MATCH (core hard skills from title + tags) ---
            job_core_text = f"{job.title} {job.title}"
            if job.tags:
                job_core_text += f" {job.tags.replace(',', ' ')}"

            job_core_stems = self._get_stems(job_core_text)
            profile_stems = self._get_stems(self._construct_profile_text(profile))

            if not job_core_stems:
                keyword_score = 0.0
            else:
                overlap = len(job_core_stems.intersection(profile_stems)) / len(job_core_stems)
                keyword_score = min(overlap * 1.5, 1.0)

            # --- SEMANTIC SIMILARITY (cosine similarity of token frequencies) ---
            profile_text = self._construct_profile_text(profile)
            job_text = self._construct_job_text_for_vector(job)

            if not profile_text or not job_text:
                semantic_score = 0.0
                raw_semantic = 0.0
            else:
                raw_semantic = _cosine_similarity(
                    self._clean_text(profile_text[:100000]),
                    self._clean_text(job_text[:100000])
                )

            # Normalize: cosine ~0.3 -> 0, ~0.8 -> 1.0
            semantic_score = max(0, (raw_semantic - 0.3) * 2.0)
            semantic_score = min(semantic_score, 1.0)

            # --- WEIGHTED FINAL SCORE ---
            final_score = (keyword_score * 0.65) + (semantic_score * 0.35)

            # Penalty: very low keyword match
            if keyword_score < 0.2:
                final_score *= 0.4

            # Boost: very high keyword match
            if keyword_score > 0.8:
                final_score = max(final_score, 0.85)

            return float(min(round(final_score * 100, 1), 98.0))

        except Exception as e:
            print(f"Error calculating score: {e}")
            return 0.0

    def parse_resume_with_llm(self, text):
        """Uses LLM to extract structured data from resume text."""
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
        profile_text = self._construct_profile_text(profile)
        job_text = self._construct_job_text_for_vector(job)

        system_prompt = f"""
        You are an expert HR Recruiter.
        Compare the candidate profile and the job description.
        The calculated match score is {score}/100.

        Provide a strict JSON response (no markdown) with:
        - "strengths": List of anywhere between 0 to 4 matching skills or experiences.
        - "missing": List of anywhere between 0 to 4 key requirements missing from the profile.
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
