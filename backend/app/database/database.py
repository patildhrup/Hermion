import sqlite3
import uuid
import json
import time
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.config.config import settings


class Database:
    def __init__(self):
        self.use_supabase = bool(settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY))
        self.supabase_client = None

        if self.use_supabase:
            try:
                from supabase import create_client
                # Prefer service-role key for server-side ops so RLS doesn't block writes
                key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
                self.supabase_client = create_client(settings.SUPABASE_URL, key)
                print(f"[DB] Supabase connected → {settings.SUPABASE_URL}")
            except Exception as e:
                print(f"[DB] Supabase init failed: {e}. Falling back to SQLite.")
                self.use_supabase = False

        import os
        self.db_path = "/tmp/hermion_local.db" if os.environ.get("VERCEL") else "hermion_local.db"
        self._init_sqlite()

        # Only seed demo data in SQLite fallback mode
        if not self.use_supabase:
            self._seed_initial_demo_data()

    # ──────────────────────────────────────────────────────────────────────────
    # SQLite helpers (used when Supabase is unavailable)
    # ──────────────────────────────────────────────────────────────────────────
    def _init_sqlite(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY, email TEXT UNIQUE, username TEXT,
                avatar_url TEXT, created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS leads (
                id TEXT PRIMARY KEY, owner_id TEXT, name TEXT, company TEXT,
                contact_info TEXT, qualification_score INTEGER DEFAULT 0,
                status TEXT DEFAULT 'new', created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS calls (
                id TEXT PRIMARY KEY, lead_id TEXT, agora_channel_name TEXT,
                started_at TEXT, ended_at TEXT, duration_sec INTEGER DEFAULT 0,
                outcome TEXT DEFAULT 'in_progress'
            );
            CREATE TABLE IF NOT EXISTS transcripts (
                id TEXT PRIMARY KEY, call_id TEXT, speaker TEXT,
                text TEXT, timestamp_ms INTEGER
            );
            CREATE TABLE IF NOT EXISTS call_summaries (
                id TEXT PRIMARY KEY, call_id TEXT, summary_text TEXT,
                next_steps TEXT, objections_raised TEXT, sentiment TEXT
            );
        """)
        conn.commit()
        conn.close()

    def _sqlite_execute(self, sql: str, params: tuple = ()):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(sql, params)
        conn.commit()
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    # ──────────────────────────────────────────────────────────────────────────
    # Seed demo data (SQLite only)
    # ──────────────────────────────────────────────────────────────────────────
    def _seed_initial_demo_data(self):
        if self.get_leads():
            return
        now = datetime.utcnow().isoformat()
        l1 = str(uuid.uuid4()); l2 = str(uuid.uuid4()); l3 = str(uuid.uuid4())
        for lead in [
            (l1, "demo-user-1", "Sarah Jenkins", "Acme Logistics",  "sarah@acmelogistics.io", 88, "qualified",    now),
            (l2, "demo-user-1", "Michael Chen",  "Vortex Cloud",    "mchen@vortexcloud.com",  95, "demo_booked", now),
            (l3, "demo-user-1", "David Ross",     "Fintech Global",  "dross@fintechglobal.co", 42, "new",         now),
        ]:
            self._sqlite_execute(
                "INSERT OR IGNORE INTO leads VALUES (?,?,?,?,?,?,?,?)", lead
            )
        # One demo call + transcript + summary for Michael Chen
        c_id = str(uuid.uuid4())
        self._sqlite_execute(
            "INSERT OR IGNORE INTO calls VALUES (?,?,?,?,?,?,?)",
            (c_id, l2, "hermion-demo-ch-101", now, now, 142, "demo_booked")
        )
        for speaker, text, ts in [
            ("hermion",  "Hello! I'm HERMION. How can I help your team today?", 1000),
            ("prospect", "Hi, we're evaluating AI voice agents for our 20-person SDR team.", 4000),
            ("hermion",  "Great! What's your primary bottleneck with lead qualification right now?", 7500),
            ("prospect", "How much does HERMION cost?", 12000),
            ("hermion",  "Our Pro Plan is $299/mo — that's 2,500 call minutes and full CRM integration, less than 10% of a full-time SDR's salary.", 16000),
            ("prospect", "Sounds good — can we book a demo Thursday at 2 PM?", 22000),
            ("hermion",  "Done! Thursday at 2 PM EST is confirmed. You'll get a calendar invite shortly.", 27000),
        ]:
            self._sqlite_execute(
                "INSERT INTO transcripts VALUES (?,?,?,?,?)",
                (str(uuid.uuid4()), c_id, speaker, text, ts)
            )
        self._sqlite_execute(
            "INSERT OR IGNORE INTO call_summaries VALUES (?,?,?,?,?,?)",
            (str(uuid.uuid4()), c_id,
             "Michael Chen from Vortex Cloud qualified for 20 SDR seats. Pricing objection handled. Demo confirmed Thursday 2 PM.",
             "Send calendar invite and product whitepaper.",
             json.dumps(["pricing"]), "highly_positive")
        )

    # ──────────────────────────────────────────────────────────────────────────
    # LEADS
    # ──────────────────────────────────────────────────────────────────────────
    def get_leads(self) -> List[Dict[str, Any]]:
        if self.use_supabase and self.supabase_client:
            try:
                res = self.supabase_client.table("leads").select("*").order("created_at", desc=True).execute()
                return res.data or []
            except Exception as e:
                print(f"[DB] get_leads Supabase error: {e}")
        return self._sqlite_execute("SELECT * FROM leads ORDER BY created_at DESC")

    def create_lead(self, data: Dict[str, Any]) -> Dict[str, Any]:
        data.setdefault("id", str(uuid.uuid4()))
        data.setdefault("created_at", datetime.utcnow().isoformat())
        data.setdefault("status", "new")
        data.setdefault("qualification_score", 0)

        if self.use_supabase and self.supabase_client:
            try:
                res = self.supabase_client.table("leads").insert(data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[DB] create_lead Supabase error: {e}")

        self._sqlite_execute(
            "INSERT OR REPLACE INTO leads VALUES (?,?,?,?,?,?,?,?)",
            (data["id"], data.get("owner_id",""), data.get("name",""),
             data.get("company",""), data.get("contact_info",""),
             data.get("qualification_score", 0), data["status"], data["created_at"])
        )
        return data

    def update_lead(self, lead_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.use_supabase and self.supabase_client:
            try:
                res = self.supabase_client.table("leads").update(updates).eq("id", lead_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[DB] update_lead Supabase error: {e}")

        fields = ", ".join(f"{k} = ?" for k in updates)
        vals = list(updates.values()) + [lead_id]
        self._sqlite_execute(f"UPDATE leads SET {fields} WHERE id = ?", tuple(vals))
        return self.get_lead_by_id(lead_id)

    def get_lead_by_id(self, lead_id: str) -> Optional[Dict[str, Any]]:
        if self.use_supabase and self.supabase_client:
            try:
                res = self.supabase_client.table("leads").select("*").eq("id", lead_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[DB] get_lead_by_id Supabase error: {e}")
        rows = self._sqlite_execute("SELECT * FROM leads WHERE id = ?", (lead_id,))
        return rows[0] if rows else None

    # ──────────────────────────────────────────────────────────────────────────
    # CALLS
    # ──────────────────────────────────────────────────────────────────────────
    def create_call(self, data: Dict[str, Any]) -> Dict[str, Any]:
        data.setdefault("id", str(uuid.uuid4()))
        data.setdefault("started_at", datetime.utcnow().isoformat())
        data.setdefault("outcome", "in_progress")
        data.setdefault("duration_sec", 0)

        if self.use_supabase and self.supabase_client:
            try:
                res = self.supabase_client.table("calls").insert(data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[DB] create_call Supabase error: {e}")

        self._sqlite_execute(
            "INSERT OR REPLACE INTO calls VALUES (?,?,?,?,?,?,?)",
            (data["id"], data.get("lead_id"), data.get("agora_channel_name"),
             data["started_at"], data.get("ended_at",""), data["duration_sec"], data["outcome"])
        )
        return data

    def update_call(self, call_id: str, updates: Dict[str, Any]):
        if self.use_supabase and self.supabase_client:
            try:
                self.supabase_client.table("calls").update(updates).eq("id", call_id).execute()
                return
            except Exception as e:
                print(f"[DB] update_call Supabase error: {e}")

        fields = ", ".join(f"{k} = ?" for k in updates)
        vals = list(updates.values()) + [call_id]
        self._sqlite_execute(f"UPDATE calls SET {fields} WHERE id = ?", tuple(vals))

    def get_calls_for_lead(self, lead_id: str) -> List[Dict[str, Any]]:
        if self.use_supabase and self.supabase_client:
            try:
                res = self.supabase_client.table("calls").select("*").eq("lead_id", lead_id).order("started_at", desc=True).execute()
                return res.data or []
            except Exception as e:
                print(f"[DB] get_calls_for_lead Supabase error: {e}")
        return self._sqlite_execute("SELECT * FROM calls WHERE lead_id = ? ORDER BY started_at DESC", (lead_id,))

    # ──────────────────────────────────────────────────────────────────────────
    # TRANSCRIPTS
    # ──────────────────────────────────────────────────────────────────────────
    def save_transcript(self, call_id: str, speaker: str, text: str, timestamp_ms: int = None) -> Dict[str, Any]:
        item = {
            "id": str(uuid.uuid4()),
            "call_id": call_id,
            "speaker": speaker,
            "text": text,
            "timestamp_ms": timestamp_ms or int(time.time() * 1000)
        }
        if self.use_supabase and self.supabase_client:
            try:
                self.supabase_client.table("transcripts").insert(item).execute()
                return item
            except Exception as e:
                print(f"[DB] save_transcript Supabase error: {e}")

        self._sqlite_execute(
            "INSERT INTO transcripts VALUES (?,?,?,?,?)",
            (item["id"], item["call_id"], item["speaker"], item["text"], item["timestamp_ms"])
        )
        return item

    def get_transcripts(self, call_id: str) -> List[Dict[str, Any]]:
        if self.use_supabase and self.supabase_client:
            try:
                res = self.supabase_client.table("transcripts").select("*").eq("call_id", call_id).order("timestamp_ms").execute()
                return res.data or []
            except Exception as e:
                print(f"[DB] get_transcripts Supabase error: {e}")
        return self._sqlite_execute("SELECT * FROM transcripts WHERE call_id = ? ORDER BY timestamp_ms", (call_id,))

    # ──────────────────────────────────────────────────────────────────────────
    # CALL SUMMARIES
    # ──────────────────────────────────────────────────────────────────────────
    def save_summary(self, data: Dict[str, Any]) -> Dict[str, Any]:
        data.setdefault("id", str(uuid.uuid4()))
        objections = data.get("objections_raised", [])

        if self.use_supabase and self.supabase_client:
            try:
                payload = {**data, "objections_raised": objections if isinstance(objections, list) else []}
                self.supabase_client.table("call_summaries").insert(payload).execute()
                return data
            except Exception as e:
                print(f"[DB] save_summary Supabase error: {e}")

        self._sqlite_execute(
            "INSERT OR REPLACE INTO call_summaries VALUES (?,?,?,?,?,?)",
            (data["id"], data.get("call_id"), data.get("summary_text",""),
             data.get("next_steps",""),
             json.dumps(objections if isinstance(objections, list) else []),
             data.get("sentiment","neutral"))
        )
        return data

    def get_summary(self, call_id: str) -> Optional[Dict[str, Any]]:
        if self.use_supabase and self.supabase_client:
            try:
                res = self.supabase_client.table("call_summaries").select("*").eq("call_id", call_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[DB] get_summary Supabase error: {e}")

        rows = self._sqlite_execute("SELECT * FROM call_summaries WHERE call_id = ?", (call_id,))
        if not rows:
            return None
        row = rows[0]
        try:
            row["objections_raised"] = json.loads(row.get("objections_raised") or "[]")
        except Exception:
            row["objections_raised"] = []
        return row


db = Database()
