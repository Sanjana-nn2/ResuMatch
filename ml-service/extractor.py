import re
import os
import logging
from typing import List, Dict, Set, Tuple
import spacy

logger = logging.getLogger("resumatch-ml.extractor")

# Comprehensive taxonomy of technical skills and keywords
TECH_SKILLS_TAXONOMY = {
    # Programming Languages
    "python": {"canonical": "Python", "category": "Languages"},
    "javascript": {"canonical": "JavaScript", "category": "Languages"},
    "typescript": {"canonical": "TypeScript", "category": "Languages"},
    "java": {"canonical": "Java", "category": "Languages"},
    "kotlin": {"canonical": "Kotlin", "category": "Languages"},
    "c++": {"canonical": "C++", "category": "Languages"},
    "c#": {"canonical": "C#", "category": "Languages"},
    "golang": {"canonical": "Go", "category": "Languages"},
    "go": {"canonical": "Go", "category": "Languages"},
    "rust": {"canonical": "Rust", "category": "Languages"},
    "ruby": {"canonical": "Ruby", "category": "Languages"},
    "php": {"canonical": "PHP", "category": "Languages"},
    "swift": {"canonical": "Swift", "category": "Languages"},
    "sql": {"canonical": "SQL", "category": "Languages"},

    # Frameworks & Libraries
    "react": {"canonical": "React.js", "category": "Frontend"},
    "react.js": {"canonical": "React.js", "category": "Frontend"},
    "next.js": {"canonical": "Next.js", "category": "Frontend"},
    "nextjs": {"canonical": "Next.js", "category": "Frontend"},
    "vue": {"canonical": "Vue.js", "category": "Frontend"},
    "angular": {"canonical": "Angular", "category": "Frontend"},
    "tailwind": {"canonical": "Tailwind CSS", "category": "Frontend"},
    "tailwind css": {"canonical": "Tailwind CSS", "category": "Frontend"},
    "node.js": {"canonical": "Node.js", "category": "Backend"},
    "nodejs": {"canonical": "Node.js", "category": "Backend"},
    "express": {"canonical": "Express.js", "category": "Backend"},
    "express.js": {"canonical": "Express.js", "category": "Backend"},
    "fastapi": {"canonical": "FastAPI", "category": "Backend"},
    "flask": {"canonical": "Flask", "category": "Backend"},
    "django": {"canonical": "Django", "category": "Backend"},
    "spring boot": {"canonical": "Spring Boot", "category": "Backend"},
    "pytorch": {"canonical": "PyTorch", "category": "Machine Learning"},
    "tensorflow": {"canonical": "TensorFlow", "category": "Machine Learning"},
    "scikit-learn": {"canonical": "Scikit-Learn", "category": "Machine Learning"},
    "spacy": {"canonical": "spaCy", "category": "Machine Learning"},
    "huggingface": {"canonical": "Hugging Face", "category": "Machine Learning"},

    # Databases & Caching
    "postgresql": {"canonical": "PostgreSQL", "category": "Databases"},
    "postgres": {"canonical": "PostgreSQL", "category": "Databases"},
    "mysql": {"canonical": "MySQL", "category": "Databases"},
    "mongodb": {"canonical": "MongoDB", "category": "Databases"},
    "redis": {"canonical": "Redis", "category": "Databases"},
    "cassandra": {"canonical": "Cassandra", "category": "Databases"},
    "elasticsearch": {"canonical": "Elasticsearch", "category": "Databases"},
    "dynamodb": {"canonical": "DynamoDB", "category": "Databases"},
    "sqlite": {"canonical": "SQLite", "category": "Databases"},
    "room": {"canonical": "Room Database", "category": "Databases"},

    # Cloud & DevOps
    "docker": {"canonical": "Docker", "category": "DevOps & Cloud"},
    "kubernetes": {"canonical": "Kubernetes", "category": "DevOps & Cloud"},
    "k8s": {"canonical": "Kubernetes", "category": "DevOps & Cloud"},
    "aws": {"canonical": "AWS", "category": "DevOps & Cloud"},
    "azure": {"canonical": "Azure", "category": "DevOps & Cloud"},
    "gcp": {"canonical": "Google Cloud", "category": "DevOps & Cloud"},
    "google cloud": {"canonical": "Google Cloud", "category": "DevOps & Cloud"},
    "terraform": {"canonical": "Terraform", "category": "DevOps & Cloud"},
    "ci/cd": {"canonical": "CI/CD Pipelines", "category": "DevOps & Cloud"},
    "github actions": {"canonical": "GitHub Actions", "category": "DevOps & Cloud"},
    "linux": {"canonical": "Linux", "category": "DevOps & Cloud"},
    "nginx": {"canonical": "Nginx", "category": "DevOps & Cloud"},

    # Architecture & Concepts
    "rest api": {"canonical": "REST API Design", "category": "Architecture"},
    "rest api design": {"canonical": "REST API Design", "category": "Architecture"},
    "graphql": {"canonical": "GraphQL", "category": "Architecture"},
    "microservices": {"canonical": "Microservices", "category": "Architecture"},
    "system design": {"canonical": "System Design", "category": "Architecture"},
    "clean architecture": {"canonical": "Clean Architecture", "category": "Architecture"},
    "mvc": {"canonical": "MVC Pattern", "category": "Architecture"},
    "oop": {"canonical": "Object-Oriented Programming", "category": "Architecture"},
    "agile": {"canonical": "Agile / Scrum", "category": "Methodology"},
    "scrum": {"canonical": "Agile / Scrum", "category": "Methodology"},

    # Testing & Tooling
    "git": {"canonical": "Git", "category": "Tools"},
    "github": {"canonical": "GitHub", "category": "Tools"},
    "postman": {"canonical": "Postman", "category": "Tools"},
    "jest": {"canonical": "Jest", "category": "Testing"},
    "pytest": {"canonical": "PyTest", "category": "Testing"},
    "junit": {"canonical": "JUnit", "category": "Testing"},
    "jwt": {"canonical": "JWT Authentication", "category": "Security"},
    "oauth": {"canonical": "OAuth2", "category": "Security"},
    "capacitor": {"canonical": "Capacitor", "category": "Mobile"},
    "android": {"canonical": "Android Development", "category": "Mobile"},
}

class SkillExtractor:
    """
    Extracts skills using a hybrid approach:
    1. Pattern matching against curated industry tech taxonomies (exact and word boundary regex).
    2. spaCy Named Entity Recognition (NER) and noun chunk analysis to capture contextual skills.
    """
    def __init__(self):
        spacy_model_name = os.getenv("SPACY_MODEL", "en_core_web_sm")
        try:
            self.nlp = spacy.load(spacy_model_name)
            logger.info(f"Loaded spaCy model: {spacy_model_name}")
        except Exception:
            logger.warning(f"spaCy model {spacy_model_name} not found locally. Loading blank English model.")
            self.nlp = spacy.blank("en")

    def extract_skills(self, text: str) -> List[Dict]:
        """
        Parses text and returns identified skills with category, occurrence count, and canonical name.
        """
        if not text:
            return []

        lower_text = " " + text.lower() + " "
        found_skills: Dict[str, Dict] = {}

        # 1. Taxonomical pattern search
        for pattern, meta in TECH_SKILLS_TAXONOMY.items():
            # Match with boundary check (handles special symbols like C++, C#, .js, etc.)
            escaped_pattern = re.escape(pattern)
            # Use negative lookbehind/lookahead for alphanumeric boundary
            regex = rf"(?<![a-zA-Z0-9_]){escaped_pattern}(?![a-zA-Z0-9_])"
            matches = re.findall(regex, lower_text)
            count = len(matches)

            if count > 0:
                canonical = meta["canonical"]
                if canonical not in found_skills:
                    found_skills[canonical] = {
                        "name": canonical,
                        "category": meta["category"],
                        "count": count
                    }
                else:
                    found_skills[canonical]["count"] += count

        # 2. Extract NER ORG/PRODUCT entities via spaCy as supplemental discovery
        try:
            doc = self.nlp(text[:5000]) # Cap to prevent excessive CPU on massive texts
            for ent in doc.ents:
                ent_clean = ent.text.strip()
                if ent.label_ in ["ORG", "PRODUCT"] and len(ent_clean) > 2 and len(ent_clean) < 30:
                    ent_lower = ent_clean.lower()
                    if ent_lower in TECH_SKILLS_TAXONOMY:
                        canonical = TECH_SKILLS_TAXONOMY[ent_lower]["canonical"]
                        if canonical not in found_skills:
                            found_skills[canonical] = {
                                "name": canonical,
                                "category": TECH_SKILLS_TAXONOMY[ent_lower]["category"],
                                "count": 1
                            }
        except Exception as e:
            logger.debug(f"spaCy entity extraction error: {e}")

        # Convert to sorted list by frequency
        result = list(found_skills.values())
        result.sort(key=lambda x: x["count"], reverse=True)
        return result

    def diff_skills(self, resume_text: str, jd_text: str) -> Dict:
        """
        Compares skills extracted from Resume vs. Job Description.
        Returns:
            - matched_skills: Skills found in BOTH
            - missing_skills: Skills required in JD but missing in Resume
            - extra_skills: Skills in Resume not specifically mentioned in JD
            - match_percentage: % of JD required skills met by Resume
        """
        resume_skills_list = self.extract_skills(resume_text)
        jd_skills_list = self.extract_skills(jd_text)

        resume_skills_map = {s["name"]: s for s in resume_skills_list}
        jd_skills_map = {s["name"]: s for s in jd_skills_list}

        matched = []
        missing = []

        for name, jd_meta in jd_skills_map.items():
            if name in resume_skills_map:
                matched.append({
                    "name": name,
                    "category": jd_meta["category"],
                    "jd_count": jd_meta["count"],
                    "resume_count": resume_skills_map[name]["count"]
                })
            else:
                missing.append({
                    "name": name,
                    "category": jd_meta["category"],
                    "jd_count": jd_meta["count"],
                    "resume_count": 0,
                    "importance": "High" if jd_meta["count"] >= 2 else "Medium"
                })

        total_jd_skills = len(jd_skills_map)
        skill_match_ratio = (len(matched) / total_jd_skills * 100.0) if total_jd_skills > 0 else 100.0

        matched.sort(key=lambda x: x["jd_count"], reverse=True)
        missing.sort(key=lambda x: (x["importance"] == "High", x["jd_count"]), reverse=True)

        return {
            "matched_skills": matched,
            "missing_skills": missing,
            "total_jd_skills": total_jd_skills,
            "total_matched": len(matched),
            "skill_match_ratio": round(skill_match_ratio, 2)
        }

    @staticmethod
    def generate_suggestions(missing_skills: List[Dict], jd_text: str) -> List[Dict]:
        """
        Generates actionable, specific resume revision suggestions based on missing keywords.
        """
        suggestions = []

        for skill in missing_skills[:6]:  # Focus on top missing keywords
            name = skill["name"]
            category = skill["category"]
            count = skill["jd_count"]
            importance = skill["importance"]

            if category in ["Languages", "Frontend", "Backend"]:
                action = f"Add '{name}' to your technical skills summary and reference it in a project bullet point."
                reason = f"Mentioned {count}x in the job description. Automated ATS filters will screen for this exact keyword."
            elif category in ["DevOps & Cloud", "Databases"]:
                action = f"Include practical experience with '{name}' in your deployment, infrastructure, or persistence stack."
                reason = f"Ranked as {importance} priority in JD. Recruiters look for operational familiarity here."
            elif category == "Architecture":
                action = f"Explicitly articulate '{name}' in your architecture or engineering experience bullet points."
                reason = f"Senior engineers evaluate candidates on engineering patterns like {name}."
            else:
                action = f"Incorporate '{name}' into your project highlights or education/certifications section."
                reason = f"Present in the role requirements ({count} mention{'s' if count > 1 else ''})."

            suggestions.append({
                "skill": name,
                "category": category,
                "importance": importance,
                "action": action,
                "reason": reason
            })

        return suggestions


# Singleton instance
skill_extractor = SkillExtractor()
