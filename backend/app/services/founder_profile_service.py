import re
from collections import Counter


STOP_WORDS = {
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "from",
    "your",
    "into",
    "have",
    "will",
    "about",
    "their",
    "they",
    "them",
    "our",
    "you",
    "are",
    "but",
    "not",
    "can",
    "its",
    "was",
    "were",
    "has",
    "had",
    "use",
    "using",
    "also",
    "more",
    "than",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "how",
}


def _first_match(patterns: list[str], text: str) -> str:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE)
        if match:
            value = str(match.group(1) or "").strip(" .:-\n\t")
            if value:
                return value[:180]
    return ""


def _extract_list_items(pattern: str, text: str) -> list[str]:
    items: list[str] = []
    for match in re.finditer(pattern, text, flags=re.IGNORECASE):
        raw = str(match.group(1) or "")
        for part in re.split(r",|;|/|\n", raw):
            value = part.strip(" .:-\t")
            if value and len(value) > 2 and value.lower() not in {item.lower() for item in items}:
                items.append(value[:120])
    return items[:8]


def _keywords_from_text(text: str) -> list[str]:
    words = re.findall(r"[A-Za-z][A-Za-z\-]{2,}", text.lower())
    counts = Counter(word for word in words if word not in STOP_WORDS)
    return [word for word, _ in counts.most_common(10)]


class FounderProfileService:
    @staticmethod
    def _infer_tone(text: str) -> str:
        lowered = text.lower()
        if any(token in lowered for token in ("vision", "future", "category", "movement")):
            return "Technical + visionary"
        if any(token in lowered for token in ("metrics", "retention", "pipeline", "conversion")):
            return "Operational + analytical"
        return "Concise + practical"

    @staticmethod
    def _derive_insights(profile: dict, docs_count: int) -> list[str]:
        insights: list[str] = []
        if docs_count > 0:
            insights.append(f"Company memory updated from {docs_count} uploaded document(s)")
        if profile.get("positioning"):
            insights.append(f"Positioning signal detected: {profile['positioning']}")
        if profile.get("audience"):
            insights.append(f"Audience focus: {profile['audience']}")
        if profile.get("competitors"):
            insights.append(f"Competitor references found: {', '.join(profile['competitors'][:3])}")
        if profile.get("goals"):
            insights.append(f"Execution goals detected: {', '.join(profile['goals'][:3])}")
        if profile.get("keywords"):
            insights.append(f"Recurring themes: {', '.join(profile['keywords'][:5])}")
        return insights[:6]

    @staticmethod
    def _derive_suggested_actions(profile: dict) -> list[dict]:
        actions = [
            {
                "id": "launch_post",
                "label": "Generate launch post",
                "prompt": "Generate a launch announcement post using my uploaded company context.",
                "reason": "Turn memory insights into external momentum.",
            },
            {
                "id": "research_competitors",
                "label": "Research competitors",
                "prompt": "Research my competitors and summarize key positioning gaps.",
                "reason": "Track market movement and differentiation opportunities.",
            },
            {
                "id": "investor_update",
                "label": "Create investor update",
                "prompt": "Create an investor update using my latest company notes and research context.",
                "reason": "Keep stakeholders aligned with current execution.",
            },
            {
                "id": "founder_thread",
                "label": "Draft founder thread",
                "prompt": "Draft a concise founder thread summarizing this week’s progress and next priorities.",
                "reason": "Maintain narrative consistency across channels.",
            },
        ]

        if profile.get("competitors"):
            actions.insert(
                1,
                {
                    "id": "competitor_response",
                    "label": "Counter-position competitor launch",
                    "prompt": "Create a counter-positioning memo against the latest competitor launch using my founder tone.",
                    "reason": "Respond to competitor movements with clear differentiation.",
                },
            )

        return actions[:6]

    @staticmethod
    def _knowledge_graph(profile: dict) -> dict:
        nodes = [
            {"id": "memory", "label": "Founder Notes", "kind": "memory"},
            {"id": "strategy", "label": profile.get("positioning") or "Launch Strategy", "kind": "strategy"},
            {"id": "output", "label": "LinkedIn Campaign", "kind": "output"},
        ]
        edges = [
            {"from": "memory", "to": "strategy"},
            {"from": "strategy", "to": "output"},
        ]
        return {"nodes": nodes, "edges": edges}

    def build(self, documents: list[dict]) -> dict:
        text_parts = [str(item.get("extracted_text") or "") for item in documents]
        corpus = "\n".join(part for part in text_parts if part).strip()

        startup_name = _first_match(
            [
                r"(?:startup|company|product)\s*name\s*[:\-]\s*([^\n]+)",
                r"we are\s+([A-Z][A-Za-z0-9\- ]{2,40})",
            ],
            corpus,
        )
        audience = _first_match(
            [
                r"(?:target audience|ideal customer|for)\s*[:\-]\s*([^\n]+)",
                r"(?:for|serving)\s+([A-Za-z0-9 ,\-]{6,120}(?:founders|teams|operators|developers|startups))",
            ],
            corpus,
        )
        positioning = _first_match(
            [
                r"(?:positioning|category|value proposition)\s*[:\-]\s*([^\n]+)",
                r"(?:we help|we enable|we build)\s+([^\n]{10,180})",
            ],
            corpus,
        )
        mission = _first_match(
            [
                r"(?:mission|vision)\s*[:\-]\s*([^\n]+)",
                r"(?:our goal is to|we aim to)\s+([^\n]{10,180})",
            ],
            corpus,
        )

        competitors = _extract_list_items(r"(?:competitors?|alternatives?)\s*[:\-]\s*([^\n]+)", corpus)
        goals = _extract_list_items(r"(?:goals?|objectives?|targets?)\s*[:\-]\s*([^\n]+)", corpus)
        keywords = _keywords_from_text(corpus)

        profile = {
            "startup_name": startup_name,
            "mission": mission,
            "positioning": positioning,
            "audience": audience,
            "tone": self._infer_tone(corpus),
            "competitors": competitors,
            "goals": goals,
            "keywords": keywords,
        }

        return {
            "profile": profile,
            "insights": self._derive_insights(profile, len(documents)),
            "suggested_actions": self._derive_suggested_actions(profile),
            "knowledge_graph": self._knowledge_graph(profile),
        }
