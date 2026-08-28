import uuid
from datetime import datetime
from typing import Any, Dict, List


class TaskService:
    def __init__(self):
        self._tasks: List[Dict[str, Any]] = []

    def create_task(self, title: str, priority: str = "medium", due_date: str = "") -> Dict[str, Any]:
        task = {
            "id": f"task-{uuid.uuid4().hex[:8]}",
            "title": title,
            "priority": priority,
            "due_date": due_date,
            "status": "open",
            "completed": False,
            "created_at": datetime.utcnow().isoformat(),
        }
        self._tasks.append(task)
        return task

    def list_tasks(self) -> List[Dict[str, Any]]:
        return list(self._tasks)

    def update_task(self, task_id: str, updates: Dict[str, Any]):
        for task in self._tasks:
            if task["id"] == task_id:
                task.update(updates)
                return task
        return None

    def complete_task(self, task_id: str):
        return self.update_task(
            task_id,
            {"status": "completed", "completed": True, "completed_at": datetime.utcnow().isoformat()},
        )


task_service = TaskService()
