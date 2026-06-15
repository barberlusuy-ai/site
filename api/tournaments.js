export default async function handler(req, res) {
    // Змінні, які створює інтеграція Upstash Redis на Vercel
    const REDIS_REST_URL = process.env.REDIS_REST_URL || process.env.STORAGE_REST_API_URL;
    const REDIS_REST_TOKEN = process.env.REDIS_REST_TOKEN || process.env.STORAGE_REST_API_TOKEN;

    // Дозволяємо запити з будь-яких пристроїв (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!REDIS_REST_URL || !REDIS_REST_TOKEN) {
        return res.status(500).json({ error: "База даних Redis не підключена або відсутні REST змінні." });
    }

    try {
        if (req.method === 'GET') {
            // Отримуємо глобальні турніри з Redis через REST API
            const response = await fetch(`${REDIS_REST_URL}/get/tournaments_global`, {
                headers: { Authorization: `Bearer ${REDIS_REST_TOKEN}` }
            });
            const result = await response.json();
            
            // Відповідь від Upstash приходить у форматі { result: "строка_з_json" }
            const data = result.result ? JSON.parse(result.result) : [];
            return res.status(200).json(data);
        } 
        
        if (req.method === 'POST') {
            // Записуємо дані у базу
            const dataToSave = JSON.stringify(req.body);
            await fetch(`${REDIS_REST_URL}/set/tournaments_global`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${REDIS_REST_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([dataToSave])
            });
            
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
