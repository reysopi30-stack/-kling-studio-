import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FREEPIK_API_KEY || '';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

async function callFreepik(method, endpoint, body = null) {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(`https://api.freepik.com${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-freepik-api-key': API_KEY },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, key_set: !!API_KEY });
});

// Generate video
app.post('/api/generate', async (req, res) => {
  try {
    const { mode, prompt, image_url, video_url, duration, aspect_ratio, cfg_scale, negative_prompt } = req.body;
    let endpoint, payload;

    if (mode === 'video') {
      endpoint = '/v1/ai/reference-to-video/kling-v3-omni-pro';
      payload = { video_url, prompt, image_url: image_url || undefined, duration: duration||'5', aspect_ratio: aspect_ratio||'16:9', cfg_scale: cfg_scale||0.5, negative_prompt: negative_prompt||'blur, distort, low quality' };
    } else if (mode === 'image') {
      endpoint = '/v1/ai/image-to-video/kling-v2-1-master';
      payload = { prompt, image_url, duration: duration||'5', aspect_ratio: aspect_ratio||'16:9', cfg_scale: cfg_scale||0.5, negative_prompt: negative_prompt||'blur, distort, low quality' };
    } else {
      endpoint = '/v1/ai/text-to-video/kling-v2-1-master';
      payload = { prompt, duration: duration||'5', aspect_ratio: aspect_ratio||'16:9', cfg_scale: cfg_scale||0.5, negative_prompt: negative_prompt||'blur, distort, low quality' };
    }

    const result = await callFreepik('POST', endpoint, payload);
    res.status(result.status).json(result.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Cek status task
app.get('/api/status/:id', async (req, res) => {
  try {
    const result = await callFreepik('GET', `/v1/ai/video-tasks/${req.params.id}`);
    res.status(result.status).json(result.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
