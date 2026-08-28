import re
from typing import Any, Dict, List


class MeetingAssistantService:
    def analyze_transcript(self, transcript: str) -> Dict[str, Any]:
        sentences = [item.strip() for item in re.split(r"(?<=[.!?])\s+", transcript) if item.strip()]
        decisions: List[str] = []
        action_items: List[str] = []
        deadlines: List[str] = []
        questions: List[str] = []
        participants = set()

        for sentence in sentences:
            lowered = sentence.lower()
            participants.update(re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b", sentence))
            if "decided" in lowered or "decision" in lowered:
                decisions.append(sentence)
            if "will " in lowered or "action item" in lowered or "follow up" in lowered:
                action_items.append(sentence)
            if any(word in lowered for word in ["friday", "monday", "tuesday", "wednesday", "thursday", "deadline", "tomorrow", "next week"]):
                deadlines.append(sentence)
            if sentence.endswith("?"):
                questions.append(sentence)

        return {
            "summary": " ".join(sentences[:3]) if sentences else "No meeting details available.",
            "decisions": decisions,
            "action_items": action_items,
            "deadlines": deadlines,
            "questions": questions,
            "participants": sorted(participants),
        }


meeting_assistant_service = MeetingAssistantService()
