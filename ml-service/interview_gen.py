import logging
from typing import List, Dict

logger = logging.getLogger("resumatch-ml.interview_gen")

# Domain knowledge base for technical interview probes
QUESTION_PROFILES = {
    "Docker": {
        "question": "Can you walk through how you containerize a multi-service application with Docker and Docker Compose, and how you optimize the image size for production?",
        "probe_reason": "The JD prioritizes containerization. Since it's missing from your resume, interviewers will test if you understand multi-stage builds and layer caching.",
        "star_advice": "Mention multi-stage builds, Alpine/slim base images, non-root users, and volume mounts for local development versus production."
    },
    "Kubernetes": {
        "question": "How do you manage service discovery, config maps, and rolling deployments in a Kubernetes cluster?",
        "probe_reason": "Listed in role requirements. They want to check if you have practical cluster management knowledge beyond basic container commands.",
        "star_advice": "Explain Pod replicas, Deployments vs StatefulSets, Ingress controllers, and readiness/liveness probes."
    },
    "PostgreSQL": {
        "question": "When designing high-throughput relational schemas in PostgreSQL, how do you approach indexing strategies and connection pooling under heavy load?",
        "probe_reason": "Relational data modeling is a core requirement of this position. Interviewers probe indexing (B-Tree vs GIN) and connection contention.",
        "star_advice": "Discuss EXPLAIN ANALYZE, B-Tree vs partial indexes, PgBouncer/connection pooling, and avoiding N+1 queries."
    },
    "Redis": {
        "question": "In what scenarios would you choose Redis over a relational database, and how do you handle cache invalidation and TTL strategies?",
        "probe_reason": "High-traffic systems depend on caching. The interviewer wants to ensure you know cache stampede prevention and eviction policies (LRU).",
        "star_advice": "Discuss Cache-Aside pattern, TTL expiration, write-through caching, and pub/sub capabilities."
    },
    "REST API Design": {
        "question": "What principles guide your RESTful API design regarding idempotency, HTTP status codes, error payload schemas, and API versioning?",
        "probe_reason": "The team builds web/mobile APIs. They will evaluate your adherence to REST conventions and contract consistency.",
        "star_advice": "Detail standard status codes (200, 201, 400, 401, 403, 404, 429, 500), URI hierarchy, PUT vs PATCH idempotency, and semantic URL versioning."
    },
    "Microservices": {
        "question": "What are the trade-offs of transitioning from a monolithic architecture to microservices, and how do you handle distributed transactions?",
        "probe_reason": "The role emphasizes distributed systems. Interviewers want to check if you understand failure modes and network latency overhead.",
        "star_advice": "Discuss Saga pattern, eventual consistency, API gateways, independent deployments, and distributed tracing (OpenTelemetry)."
    },
    "CI/CD Pipelines": {
        "question": "How would you design an automated CI/CD pipeline that enforces linting, automated unit/integration tests, and zero-downtime deployment?",
        "probe_reason": "Modern engineering teams expect engineers to own their deployment pipeline from commit to production.",
        "star_advice": "Explain GitHub Actions/GitLab CI workflows, automated lint/test checks on PRs, artifact building, and blue-green or canary releases."
    },
    "FastAPI": {
        "question": "How does FastAPI achieve high performance with Python async/await, and how do you leverage Pydantic for request validation?",
        "probe_reason": "Core backend framework in this stack. They want to verify you understand ASGI servers (Uvicorn) and event loop concurrency.",
        "star_advice": "Highlight Starlette ASGI foundation, coroutines, non-blocking I/O for external network/DB calls, and Pydantic schema validation."
    },
    "React.js": {
        "question": "How does the React Virtual DOM diffing algorithm work, and how do you prevent unnecessary re-renders in performance-critical views?",
        "probe_reason": "Frontend role requirement. They test your grasp of reconciliation, memoization, and component state lifecycles.",
        "star_advice": "Discuss React reconciliation, useMemo, useCallback, React.memo, and keeping state localized."
    },
    "TypeScript": {
        "question": "How do generics and union discrimination in TypeScript improve type safety and maintainability in large codebases?",
        "probe_reason": "They want to confirm you write robust, typed code rather than relying on 'any' escape hatches.",
        "star_advice": "Mention discriminated unions, generic constraints, mapped types, and strict null checks."
    },
    "GraphQL": {
        "question": "What problems does GraphQL solve compared to traditional REST, and how do you solve the classic N+1 query problem on resolvers?",
        "probe_reason": "The JD requests GraphQL API experience; interviewers probe DataLoader batching and over-fetching.",
        "star_advice": "Explain client-defined query schemas, single endpoint advantages, and DataLoader for query batching/caching."
    },
    "AWS": {
        "question": "How would you architect a serverless or containerized web application on AWS with high availability and least-privilege security?",
        "probe_reason": "Cloud proficiency is requested. Interviewers assess IAM policies, VPC subnetting, and managed services.",
        "star_advice": "Mention ECS/Fargate or Lambda, ALB, RDS Multi-AZ, S3, CloudFront, and IAM roles without hardcoded keys."
    }
}

class InterviewQuestionGenerator:
    """
    Generates targeted, high-probability interview questions based on the candidate's missing skills.
    Framed as: 'These are the exact areas interviewers will probe based on the JD requirements.'
    """
    def generate_questions(self, missing_skills: List[Dict], max_questions: int = 4) -> List[Dict]:
        questions = []
        seen_skills = set()

        # 1. Match against curated high-signal technical profiles
        for skill_meta in missing_skills:
            skill_name = skill_meta["name"]
            if skill_name in QUESTION_PROFILES and skill_name not in seen_skills:
                profile = QUESTION_PROFILES[skill_name]
                questions.append({
                    "skill": skill_name,
                    "category": skill_meta.get("category", "General"),
                    "question": profile["question"],
                    "probe_reason": profile["probe_reason"],
                    "star_advice": profile["star_advice"]
                })
                seen_skills.add(skill_name)
                if len(questions) >= max_questions:
                    break

        # 2. Dynamic fallback synthesizer for any missing technical skill not in predefined dictionary
        if len(questions) < max_questions:
            for skill_meta in missing_skills:
                skill_name = skill_meta["name"]
                if skill_name not in seen_skills:
                    category = skill_meta.get("category", "Technology")
                    question_text = f"Can you explain your hands-on experience with {skill_name}, and how you would integrate it within an enterprise {category.lower()} pipeline?"
                    probe_reason = f"The job description explicitly mentions '{skill_name}', but your resume does not showcase it. The technical screener will test your conceptual fundamentals."
                    star_advice = f"Be honest about your depth, discuss parallel tools you know, and explain the core design trade-offs of {skill_name}."

                    questions.append({
                        "skill": skill_name,
                        "category": category,
                        "question": question_text,
                        "probe_reason": probe_reason,
                        "star_advice": star_advice
                    })
                    seen_skills.add(skill_name)
                    if len(questions) >= max_questions:
                        break

        return questions


# Singleton instance
interview_generator = InterviewQuestionGenerator()
