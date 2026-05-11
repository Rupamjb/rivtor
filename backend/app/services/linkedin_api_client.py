from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import quote

import httpx


class LinkedInApiClient:
    def __init__(
        self,
        *,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
        scope: str,
        client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self._client_id = client_id.strip()
        self._client_secret = client_secret.strip()
        self._redirect_uri = redirect_uri.strip()
        self._scope = scope.strip() or "openid profile w_member_social"
        self._client = client

    def validate_config(self) -> None:
        if not self._client_id or not self._client_secret or not self._redirect_uri:
            raise RuntimeError("LinkedIn app not configured")

    async def build_authorization_url(self, *, state: str) -> str:
        self.validate_config()
        encoded_redirect_uri = quote(self._redirect_uri, safe="")
        encoded_scope = quote(self._scope, safe="")
        return (
            "https://www.linkedin.com/oauth/v2/authorization"
            f"?response_type=code&client_id={self._client_id}"
            f"&redirect_uri={encoded_redirect_uri}"
            f"&state={state}"
            f"&scope={encoded_scope}"
        )

    async def exchange_code_for_token(self, *, code: str) -> dict:
        self.validate_config()
        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self._redirect_uri,
            "client_id": self._client_id,
            "client_secret": self._client_secret,
        }
        try:
            if self._client is not None:
                response = await self._client.post(
                    "https://www.linkedin.com/oauth/v2/accessToken",
                    data=payload,
                )
            else:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(
                        "https://www.linkedin.com/oauth/v2/accessToken",
                        data=payload,
                    )
        except httpx.HTTPError as exc:
            raise RuntimeError("LinkedIn provider unavailable") from exc

        if response.status_code >= 500:
            raise RuntimeError("LinkedIn provider unavailable")
        if response.status_code >= 400:
            raise RuntimeError("LinkedIn authorization failed")

        data = response.json()
        access_token = str(data.get("access_token") or "")
        expires_in = int(data.get("expires_in") or 0)
        if not access_token or expires_in <= 0:
            raise RuntimeError("LinkedIn authorization failed")

        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        return {
            "access_token": access_token,
            "expires_in": expires_in,
            "access_token_expires_at": expires_at.isoformat().replace("+00:00", "Z"),
        }

    async def fetch_member_urn(self, *, access_token: str) -> str:
        headers = {
            "Authorization": f"Bearer {access_token}",
        }
        try:
            if self._client is not None:
                response = await self._client.get("https://api.linkedin.com/v2/userinfo", headers=headers)
            else:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.get("https://api.linkedin.com/v2/userinfo", headers=headers)
        except httpx.HTTPError as exc:
            raise RuntimeError("LinkedIn provider unavailable") from exc

        if response.status_code >= 500:
            raise RuntimeError("LinkedIn provider unavailable")
        if response.status_code >= 400:
            raise RuntimeError("LinkedIn authorization failed")

        data = response.json()
        subject = str(data.get("sub") or "").strip()
        if not subject:
            raise RuntimeError("LinkedIn authorization failed")
        return f"urn:li:person:{subject}"

    async def _upload_image_asset(
        self,
        *,
        access_token: str,
        author_urn: str,
        image_bytes: bytes,
        image_content_type: str,
    ) -> str:
        register_payload = {
            "registerUploadRequest": {
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "owner": author_urn,
                "serviceRelationships": [
                    {
                        "relationshipType": "OWNER",
                        "identifier": "urn:li:userGeneratedContent",
                    }
                ],
            }
        }
        headers = {
            "Authorization": f"Bearer {access_token}",
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json",
        }

        try:
            if self._client is not None:
                register_response = await self._client.post(
                    "https://api.linkedin.com/v2/assets?action=registerUpload",
                    headers=headers,
                    json=register_payload,
                )
            else:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    register_response = await client.post(
                        "https://api.linkedin.com/v2/assets?action=registerUpload",
                        headers=headers,
                        json=register_payload,
                    )
        except httpx.HTTPError as exc:
            raise RuntimeError("LinkedIn provider unavailable") from exc

        if register_response.status_code == 429:
            raise RuntimeError("LinkedIn rate limited")
        if register_response.status_code >= 500:
            raise RuntimeError("LinkedIn provider unavailable")
        if register_response.status_code >= 400:
            raise RuntimeError("LinkedIn publish failed")

        register_data = register_response.json()
        value = register_data.get("value") if isinstance(register_data, dict) else None
        if not isinstance(value, dict):
            raise RuntimeError("LinkedIn publish failed")

        asset = str(value.get("asset") or "").strip()
        upload_mechanism = value.get("uploadMechanism") if isinstance(value, dict) else {}
        upload_http = (
            upload_mechanism.get("com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest")
            if isinstance(upload_mechanism, dict)
            else None
        )
        upload_url = str(upload_http.get("uploadUrl") or "").strip() if isinstance(upload_http, dict) else ""

        if not asset or not upload_url:
            raise RuntimeError("LinkedIn publish failed")

        upload_headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": image_content_type or "image/png",
        }
        try:
            if self._client is not None:
                upload_response = await self._client.put(upload_url, headers=upload_headers, content=image_bytes)
            else:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    upload_response = await client.put(upload_url, headers=upload_headers, content=image_bytes)
        except httpx.HTTPError as exc:
            raise RuntimeError("LinkedIn provider unavailable") from exc

        if upload_response.status_code == 429:
            raise RuntimeError("LinkedIn rate limited")
        if upload_response.status_code >= 500:
            raise RuntimeError("LinkedIn provider unavailable")
        if upload_response.status_code >= 400:
            raise RuntimeError("LinkedIn publish failed")

        return asset

    async def publish_post(
        self,
        *,
        access_token: str,
        author_urn: str,
        content: str,
        image_bytes: bytes = b"",
        image_content_type: str = "",
    ) -> dict:
        media_asset = ""
        if image_bytes:
            try:
                media_asset = await self._upload_image_asset(
                    access_token=access_token,
                    author_urn=author_urn,
                    image_bytes=image_bytes,
                    image_content_type=image_content_type,
                )
            except RuntimeError:
                media_asset = ""

        share_content = {
            "shareCommentary": {"text": content},
            "shareMediaCategory": "IMAGE" if media_asset else "NONE",
        }
        if media_asset:
            share_content["media"] = [{"status": "READY", "media": media_asset}]

        payload = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": share_content
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
        }
        headers = {
            "Authorization": f"Bearer {access_token}",
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json",
        }

        try:
            if self._client is not None:
                response = await self._client.post("https://api.linkedin.com/v2/ugcPosts", headers=headers, json=payload)
            else:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    response = await client.post("https://api.linkedin.com/v2/ugcPosts", headers=headers, json=payload)
        except httpx.HTTPError as exc:
            raise RuntimeError("LinkedIn provider unavailable") from exc

        if response.status_code == 429:
            raise RuntimeError("LinkedIn rate limited")
        if response.status_code >= 500:
            raise RuntimeError("LinkedIn provider unavailable")
        if response.status_code >= 400:
            raise RuntimeError("LinkedIn publish failed")

        post_urn = str(response.headers.get("x-restli-id") or "").strip()
        if not post_urn:
            data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            post_urn = str(data.get("id") or "").strip()

        if not post_urn:
            raise RuntimeError("LinkedIn publish failed")

        return {
            "linkedin_post_urn": post_urn,
            "linkedin_post_url": f"https://www.linkedin.com/feed/update/{post_urn}",
        }
