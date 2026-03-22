import requests
import os
from dotenv import load_dotenv
load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


def _get_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def api_get(path: str, token: str, params: dict = None) -> dict:
    """Make a GET request to the Node.js backend."""
    response = requests.get(
        f"{BACKEND_URL}{path}",
        headers=_get_headers(token),
        params=params,
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def api_post(path: str, token: str, body: dict) -> dict:
    """Make a POST request to the Node.js backend."""
    response = requests.post(
        f"{BACKEND_URL}{path}",
        headers=_get_headers(token),
        json=body,
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def api_patch(path: str, token: str, body: dict = None) -> dict:
    """Make a PATCH request to the Node.js backend."""
    response = requests.patch(
        f"{BACKEND_URL}{path}",
        headers=_get_headers(token),
        json=body or {},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def api_put(path: str, token: str, body: dict) -> dict:
    """Make a PUT request to the Node.js backend."""
    response = requests.put(
        f"{BACKEND_URL}{path}",
        headers=_get_headers(token),
        json=body,
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def api_delete(path: str, token: str) -> dict:
    """Make a DELETE request to the Node.js backend."""
    response = requests.delete(
        f"{BACKEND_URL}{path}",
        headers=_get_headers(token),
        timeout=10,
    )
    response.raise_for_status()
    return response.json()