import uuid
from datetime import datetime
from typing import Any, Dict, List


class EmailService:
    def __init__(self):
        self._emails: List[Dict[str, Any]] = [
            {
                "id": "email-1",
                "sender": "Engineering Team",
                "subject": "Deployment Update",
                "body": "The deployment has been delayed while final testing completes.",
                "status": "received",
            }
        ]
        self._drafts: List[Dict[str, Any]] = []

    def search_emails(self, query: str) -> List[Dict[str, Any]]:
        q = query.lower()
        return [
            email for email in self._emails
            if q in email["subject"].lower() or q in email["body"].lower() or q in email["sender"].lower()
        ]

    def draft_email(self, to: str, subject: str, message: str) -> Dict[str, Any]:
        draft = {
            "id": f"draft-{uuid.uuid4().hex[:8]}",
            "to": to,
            "subject": subject,
            "message": message,
            "status": "draft",
            "created_at": datetime.utcnow().isoformat(),
        }
        self._drafts.append(draft)
        return draft

    def send_email(self, draft_id: str):
        for draft in self._drafts:
            if draft["id"] == draft_id:
                draft["status"] = "sent"
                draft["sent_at"] = datetime.utcnow().isoformat()
                return draft
        return None


email_service = EmailService()
