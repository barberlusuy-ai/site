from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request

# ПРАВИЛЬНО: Вказуємо системні назви змінних. Vercel сам підставить замість них потрібні посилання та токени!
UPSTASH_URL = os.environ.get("https://vercel.com/barberlusuy-6752s-projects/untitled-1/integrations/redis/icfg_whXxhjOIPNAFws4DrUGe9NwI/resources/storage/store_Mo4F58hp7usEyJyl/guides")
UPSTASH_TOKEN = os.environ.get("redis://default:IWFPdrEQutgB5wuouPqpEmh6nlo88Gl9@zoo-vest-centered-95952.db.redis.io:16288")

def get_from_redis():
    """Читаємо турнірну сітку з Redis через REST API"""
    if not UPSTASH_URL or not UPSTASH_TOKEN:
        print("Помилка: Токени Redis не знайдені в системі!")
        return []
    try:
        # Надсилаємо GET запит на ключ 'tournaments'
        url = f"{UPSTASH_URL}/get/tournaments"
        req = urllib.request.Request(url)
        req.add_header("Authorization", f"Bearer {UPSTASH_TOKEN}")
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            data_str = result.get("result")
            if data_str:
                return json.loads(data_str)
            return []
    except Exception as e:
        print(f"Помилка читання з Redis: {e}")
        return []

def save_to_redis(data):
    """Записуємо турнірну сітку в Redis через REST API"""
    if not UPSTASH_URL or not UPSTASH_TOKEN:
        print("Помилка запису: Відсутні змінні оточення!")
        return False
    try:
        url = f"{UPSTASH_URL}/set/tournaments"
        req = urllib.request.Request(url, method="POST")
        req.add_header("Authorization", f"Bearer {UPSTASH_TOKEN}")
        req.add_header("Content-Type", "application/json")
        
        # ВИПРАВЛЕНО: Робимо один чистий json.dumps та кодуємо в байти для REST API Upstash
        json_string = json.dumps(data, ensure_ascii=False)
        payload = json.dumps(json_string).encode('utf-8')
        
        with urllib.request.urlopen(req, data=payload) as response:
            return True
    except Exception as e:
        print(f"Помилка запису в Redis: {e}")
        return False

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Завантажуємо актуальний стан турнірів перед віддачею фронтенду
        tournaments_data = get_from_redis()
        
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
            
            # Надійно зберігаємо дані в базу
            success = save_to_redis(data)
            
            if success:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            else:
                raise Exception("База даних відхилила запис або токени недійсні")
                
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
