from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    chroma_collection: str = "founderos-memory"
    chroma_api_key: str = ""
    chroma_tenant: str = ""
    chroma_database: str = ""
    chroma_cloud_host: str = "api.trychroma.com"
    chroma_cloud_port: int = 8000
    chroma_cloud_ssl: bool = True
    aws_region: str = "us-east-1"
    bedrock_embedding_model: str = "amazon.titan-embed-text-v2:0"
    bedrock_chat_model: str = "moonshotai.kimi-k2.5"
    bedrock_chat_fallback_models: str = "minimax.minimax-m2.5,deepseek.v3.2,deepseek.r1-v1:0"
    aws_bearer_token_bedrock: str = ""
    search_provider: str = "tavily"
    tavily_api_key: str = ""
    serper_api_key: str = ""
    linkedin_client_id: str = ""
    linkedin_client_secret: str = ""
    linkedin_redirect_uri: str = ""
    linkedin_scope: str = "openid profile w_member_social"
    whisper_api_key: str = ""
    whisper_api_base_url: str = "https://api.openai.com/v1"
    whisper_model: str = "whisper-1"
    whisper_provider: str = "openai"
    whisper_local_model: str = "base"
    whisper_local_device: str = "cpu"
    whisper_local_compute_type: str = "int8"
    whisper_local_language: str = "en"
    voice_max_upload_mb: int = 10
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_image_deployment: str = ""
    azure_openai_api_version: str = "2025-04-01-preview"
    azure_openai_image_size: str = "1024x1024"
    azure_openai_image_timeout_sec: int = 180


@lru_cache
def get_settings() -> Settings:
    return Settings()
