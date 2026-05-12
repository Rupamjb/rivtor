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
            host="chroma.railway.internal",
            port=8000,
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


def test_chroma_store_falls_back_to_http_client_when_cloud_credentials_missing() -> None:
    fake_collection = MagicMock()
    http_client_instance = MagicMock()
    http_client_instance.get_or_create_collection.return_value = fake_collection

    cloud_client = MagicMock()
    http_client = MagicMock(return_value=http_client_instance)
    fake_chromadb = _fake_chromadb_module(cloud_client=cloud_client, http_client=http_client)

    with patch.dict("sys.modules", {"chromadb": fake_chromadb}):
        ChromaStore(
            host="chroma.railway.internal",
            port=8000,
            collection_name="founderos-memory",
            api_key="",
            tenant="",
            database="",
        )

    http_client.assert_called_once_with(host="chroma.railway.internal", port=8000)
    cloud_client.assert_not_called()
