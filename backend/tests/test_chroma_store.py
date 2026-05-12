import types
from unittest.mock import MagicMock, patch

from backend.app.services.chroma_store import ChromaStore


def _fake_chromadb_module(*, cloud_client: MagicMock, http_client: MagicMock):
    module = types.ModuleType("chromadb")
    module.CloudClient = cloud_client
    module.HttpClient = http_client
    return module


def test_chroma_store_uses_cloud_client_when_cloud_credentials_present() -> None:
    fake_collection = MagicMock()
    cloud_client_instance = MagicMock()
    cloud_client_instance.get_or_create_collection.return_value = fake_collection

    cloud_client = MagicMock(return_value=cloud_client_instance)
    http_client = MagicMock()
    fake_chromadb = _fake_chromadb_module(cloud_client=cloud_client, http_client=http_client)

    with patch.dict("sys.modules", {"chromadb": fake_chromadb}):
        ChromaStore(
            collection_name="founderos-memory",
            api_key="test-api-key",
            tenant="test-tenant",
            database="test-database",
        )

    cloud_client.assert_called_once_with(
        tenant="test-tenant",
        database="test-database",
        api_key="test-api-key",
        cloud_host="api.trychroma.com",
        cloud_port=8000,
        enable_ssl=True,
    )
    http_client.assert_not_called()


def test_chroma_store_raises_when_cloud_credentials_missing() -> None:
    cloud_client = MagicMock()
    http_client = MagicMock()
    fake_chromadb = _fake_chromadb_module(cloud_client=cloud_client, http_client=http_client)

    with patch.dict("sys.modules", {"chromadb": fake_chromadb}):
        try:
            ChromaStore(
                collection_name="founderos-memory",
                api_key="",
                tenant="",
                database="",
            )
        except RuntimeError as exc:
            assert "Chroma Cloud credentials are required" in str(exc)
        else:
            raise AssertionError("Expected missing cloud credentials to raise RuntimeError")

    http_client.assert_not_called()
    cloud_client.assert_not_called()
