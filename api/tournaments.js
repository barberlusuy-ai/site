from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request

# Отримуємо налаштування бази даних, які Vercel автоматично прописав у проект
KV_URL = os.environ.get("KV_REST_API_URL")
KV_TOKEN = os.environ.get("KV_REST_API_TOKEN")

def get_from_kv():
    """Функція для читання турнірів з бази даних Vercel KV"""
    if not KV_URL or not KV_TOKEN:
        return []
    try:
        # Відправляємо команду GET tournaments на REST API Vercel KV
        url = f"{KV_URL}/get/tournaments"
        req = urllib.request.Request(url)
        req.add_header("Authorization", f"Bearer {KV_TOKEN}")
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            # Vercel KV повертає результат у полі "result"
            data_str = result.get("result")
            if data_str:
                return json.loads(data_str)
            return []
    except Exception as e:
        print(f"Помилка читання з KV: {e}")
        return []

def save_to_kv(data):
    """Функція для запису турнірів у базу даних Vercel KV"""
    if not KV_URL or not KV_TOKEN:
        return False
    try:
        # Відправляємо команду SET tournaments із нашими даними
        url = f"{KV_URL}/set/tournaments"
        req = urllib.request.Request(url, method="POST")
        req.add_header("Authorization", f"Bearer {KV_TOKEN}")
        req.add_header("Content-Type", "application/json")
        
        # Перетворюємо дані в рядок JSON і відправляємо тілом запиту
        payload = json.dumps(json.dumps(data, ensure_ascii=False))
        
        with urllib.request.urlopen(req, data=payload.encode('utf-8')) as response:
            return True
    except Exception as e:
        print(f"Помилка запису в KV: {e}")
        return False

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Завантажуємо актуальні дані з бази даних
        tournaments_data = get_from_kv()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(tournaments_data, ensure_ascii=False).encode('utf-8'))

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Надійно зберігаємо дані в базу даних KV
            success = save_to_kv(data)
            
            if success:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            else:
                raise Exception("База даних відхилила запис")
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
