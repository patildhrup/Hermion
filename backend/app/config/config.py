import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file (check app/.env, parent .env, current directory)
possible_env_paths = [
    Path(__file__).parent.parent / ".env",
    Path(__file__).parent / ".env",
    Path.cwd() / "app" / ".env",
    Path.cwd() / ".env"
]
for p in possible_env_paths:
    if p.exists():
        load_dotenv(dotenv_path=p, override=True)
        break
else:
    load_dotenv()


class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    HERMION_PUBLIC_URL: str = os.getenv("HERMION_PUBLIC_URL", "http://localhost:8000").rstrip("/")
    
    # Agora
    AGORA_APP_ID: str = os.getenv("AGORA_APP_ID", "")
    AGORA_APP_CERT: str = os.getenv("AGORA_APP_CERT", "")
    AGORA_CUSTOMER_ID: str = os.getenv("AGORA_CUSTOMER_ID", "")
    AGORA_CUSTOMER_SECRET: str = os.getenv("AGORA_CUSTOMER_SECRET", "")
    
    # LLM
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    HERMION_MODELS: list[str] = [
        m.strip() for m in os.getenv(
            "HERMION_MODELS",
            "llama-3.3-70b-versatile,openai/gpt-oss-20b,llama-3.1-8b-instant,moonshotai/kimi-k2-instruct"
        ).split(",") if m.strip()
    ]
    
    # TTS
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    TTS_VOICE_HERMION: str = os.getenv("TTS_VOICE_HERMION", "")
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "")
    
    # Qdrant
    QDRANT_URL: str = os.getenv("QDRANT_URL", "")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")

    # MongoDB
    MONGO_URL: str = os.getenv("MONGO_URL", "")

    def get_public_url(self) -> str:
        # Re-read HERMION_PUBLIC_URL from env every time, per requirement
        url = os.getenv("HERMION_PUBLIC_URL", self.HERMION_PUBLIC_URL).rstrip("/")
        return url

settings = Settings()
