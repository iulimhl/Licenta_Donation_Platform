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

result = subprocess.run([
    "docker", "compose", "exec", "-T", "backend", "python", "-c",
    "import json, sqlite3; "
    "row = sqlite3.connect('/data/donations.db').execute("
    f"'SELECT recommendation_embedding FROM donations WHERE id = ?', ({donation['id']},)).fetchone(); "
    "print(json.dumps(json.loads(row[0])))",
], check=True, capture_output=True, text=True)
assert len(json.loads(result.stdout)["vector"]) == 384
print("Donation, authentication, uploaded image and AI embedding survive container recreation.")
