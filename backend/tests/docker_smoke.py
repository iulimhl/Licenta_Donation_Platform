import base64
import json
import subprocess
import time
from uuid import uuid4

import requests


base_url = "http://127.0.0.1:8080"
api_url = f"{base_url}/api"
email = f"docker-{uuid4().hex}@example.invalid"
photo = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII="
)

response = requests.post(f"{api_url}/auth/register", json={
    "email": email, "password": "DonationDocker123!", "name": "Docker donor",
}, timeout=30)
response.raise_for_status()
headers = {"Authorization": f"Bearer {response.json()['auth_token']}"}

response = requests.post(f"{api_url}/donations/", headers=headers, json={
    "title": "Carti pentru copii", "location": "Iasi", "category": "education",
    "description": "Carti in stare buna pentru elevi.",
    "image": f"data:image/png;base64,{base64.b64encode(photo).decode()}",
}, timeout=120)
response.raise_for_status()
donation = response.json()

response = requests.post(f"{api_url}/auth/user/{email}/upload-logo", headers=headers,
                         files={"file": ("logo.png", photo, "image/png")}, timeout=30)
response.raise_for_status()
logo_url = f"{api_url}{response.json()['logo_url']}"

org_email = f"organization-{uuid4().hex}@example.invalid"
response = requests.post(f"{api_url}/auth/register", json={
    "email": org_email, "password": "DonationDocker123!", "name": "Organizatie Demo",
    "user_type": "organization", "cif": "99999999",
}, timeout=30)
response.raise_for_status()
org_headers = {"Authorization": f"Bearer {response.json()['auth_token']}"}
response = requests.post(f"{api_url}/verification/upload-document", headers=org_headers,
                         data={"email": org_email},
                         files={"file": ("certificate.pdf", b"%PDF-test", "application/pdf")}, timeout=30)
response.raise_for_status()
document_url = f"{api_url}{response.json()['document_url']}"
response = requests.post(f"{api_url}/verification/organization", headers=org_headers,
                         json={"email": org_email, "name": "Organizatie Demo", "cif": "99999999"}, timeout=180)
response.raise_for_status()
assert response.json()["status"] == "pending"

subprocess.run(["docker", "compose", "down"], check=True)
subprocess.run(["docker", "compose", "up", "-d", "--wait", "--wait-timeout", "120"], check=True)

for attempt in range(30):
    try:
        response = requests.get(f"{api_url}/ping", timeout=5)
        response.raise_for_status()
        break
    except requests.RequestException:
        if attempt == 29:
            raise
        time.sleep(2)

response = requests.get(f"{api_url}/donations/{donation['id']}", timeout=30)
response.raise_for_status()
assert response.json()["title"] == donation["title"]
response = requests.get(f"{api_url}/auth/user/{email}", headers=headers, timeout=30)
response.raise_for_status()
assert response.json()["email"] == email
response = requests.get(logo_url, timeout=30)
response.raise_for_status()
assert response.content == photo
assert requests.get(document_url, timeout=30).status_code == 401
response = requests.get(document_url, headers=org_headers, timeout=30)
response.raise_for_status()
assert response.content == b"%PDF-test"

result = subprocess.run([
    "docker", "compose", "exec", "-T", "backend", "python", "-c",
    "import json; from db.database import SessionLocal; from models.donation import DonationModel; "
    f"db = SessionLocal(); item = db.get(DonationModel, {donation['id']}); "
    "print(json.dumps(item.recommendation_embedding)); db.close()",
], check=True, capture_output=True, text=True)
assert len(json.loads(result.stdout)["vector"]) == 384
print("Donation, authentication, images, private documents and AI embeddings survive container recreation.")
