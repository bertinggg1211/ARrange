const crypto = require('crypto');

function getEnv(name, fallback = undefined) {
  const v = process.env[name];
  if (v === undefined || v === null || v === '') return fallback;
  return v;
}

const KIRI_API_KEY = getEnv('KIRI_API_KEY');
const KIRI_BASE_URL = getEnv('KIRI_BASE_URL', 'https://api.kiriengine.app');
const KIRI_WEBHOOK_SECRET = getEnv('KIRI_WEBHOOK_SECRET');
const APP_PUBLIC_URL = getEnv('APP_PUBLIC_URL');

function requireEnv(vars) {
  const missing = vars.filter((n) => !getEnv(n));
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

async function startReconstructionJob({ productId, imageUrls = [], quality = 'high' }) {
  requireEnv(['KIRI_API_KEY', 'APP_PUBLIC_URL']);
  if (!Array.isArray(imageUrls) || imageUrls.length < 10) {
    throw new Error('At least 10 images are required to start AR build');
  }

  const webhookUrl = `${APP_PUBLIC_URL.replace(/\/$/, '')}/api/ar/webhook/kiri`;

  const body = {
    productId,
    quality,
    inputs: imageUrls,
    webhookUrl,
    output: {
      format: 'glb',
    },
  };

  const res = await fetch(`${KIRI_BASE_URL}/v1/reconstructions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIRI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) {}
  if (!res.ok) {
    const message = data?.message || `KIRI job start failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  // Expected: { jobId, status, ... }
  return data;
}

function verifyWebhookSignature(rawBody, signature) {
  if (!KIRI_WEBHOOK_SECRET) return false;
  try {
    const hmac = crypto.createHmac('sha256', KIRI_WEBHOOK_SECRET);
    hmac.update(rawBody, 'utf8');
    const digest = hmac.digest('hex');
    // Signature header expected as hex; support common formats
    const provided = String(signature || '').trim().toLowerCase().replace(/^sha256=/, '');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(provided));
  } catch (_) {
    return false;
  }
}

module.exports = { startReconstructionJob, verifyWebhookSignature };

// Lightweight connectivity check trying a few likely endpoints
async function pingKiri() {
  const endpoints = [
    `${KIRI_BASE_URL}/v1/health`,
    `${KIRI_BASE_URL}/v1`,
    `${KIRI_BASE_URL}`,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: KIRI_API_KEY ? { Authorization: `Bearer ${KIRI_API_KEY}` } : {},
      });
      if (res.ok) return true;
    } catch (_) {}
  }
  return false;
}

module.exports.pingKiri = pingKiri;


