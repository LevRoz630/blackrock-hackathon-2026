import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8000'
  : 'http://10.0.2.2:8000';

const DEMO_SETTINGS = {
  block_enabled: true,
  block_threshold: 50,
  high_risk_enabled: true,
  high_risk_budget: 60,
  high_risk_remaining: 42,
  high_risk_window_minutes: 240,
  high_risk_unit_label: 'drinks',
  high_risk_unit_cost: 6,
};

const DEMO_TRANSACTIONS = [
  { id: '1', merchant: 'Tesco Express', amount: 8.50, time: '19:42' },
  { id: '2', merchant: 'Uber Eats', amount: 14.99, time: '18:15' },
  { id: '3', merchant: "Pret A Manger", amount: 4.60, time: '12:30' },
  { id: '4', merchant: 'Amazon', amount: 29.99, time: '10:05' },
];

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

export async function getSettings(userId) {
  try {
    return await request('GET', `/users/${userId}/settings`);
  } catch {
    return DEMO_SETTINGS;
  }
}

export function getDemoTransactions() {
  return DEMO_TRANSACTIONS;
}

export function registerFcmToken(userId, token) {
  return request('POST', `/users/${userId}/fcm-token`, { token });
}

export function getInsights(userId) {
  return request('GET', `/users/${userId}/insights`);
}
