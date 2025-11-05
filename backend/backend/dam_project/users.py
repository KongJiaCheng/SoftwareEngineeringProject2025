import requests

url = "http://127.0.0.1:8000/api/auth/simple-login/"
data = {"username": "testuser", "password": "MyP@ssw0rd"}
r = requests.post(url, json=data)
print(r.status_code, r.text)
