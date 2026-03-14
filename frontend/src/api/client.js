const BASE_URL = 'http://10.0.2.2:8000';

async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export function postWebhook(payload) {
  return request('POST', '/webhooks/marqeta', payload);
}

export function decideTransaction(payload) {
  return request('POST', '/transactions/decide', payload);
}

export function updateSettings(userId, settings) {
  return request('POST', `/users/${userId}/settings`, settings);
}

export function getSettings(userId) {
  return request('GET', `/users/${userId}/settings`);
}

export function registerFcmToken(userId, token) {
  return request('POST', `/users/${userId}/fcm-token`, { token });
}
