export default async function handler(req, res) {
    // Використовуємо змінні з префіксом STORAGE, які згенерував Vercel
    const KV_REST_API_URL = process.env.STORAGE_REST_API_URL;
    const KV_REST_API_TOKEN = process.env.STORAGE_REST_API_TOKEN;

    // Дозволяємо запити з будь-яких пристроїв (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
        return res.status(500).json({ error: "База даних не налаштована. Перевірте змінні оточення." });
    }

    try {
        if (req.method === 'GET') {
            // Запит актуальних даних із бази
            const response = await fetch(`${KV_REST_API_URL}/get/tournaments_global`, {
                headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` }
            });
            const result = await response.json();
            const data = result.result ? JSON.parse(result.result) : [];
            return res.status(200).json(data);
        } 
        
        if (req.method === 'POST') {
            // Збереження нових даних у базу
            const dataToSave = JSON.stringify(req.body);
            await fetch(`${KV_REST_API_URL}/set/tournaments_global`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${KV_REST_API_TOKEN}`,
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
