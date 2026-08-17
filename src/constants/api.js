export const BASE_URL = 'https://pathofsung.pythonanywhere.com';

export const ENDPOINTS = {
  login: `${BASE_URL}/api/auth/authenticate/`,
  register: `${BASE_URL}/api/auth/authenticate/`,
  balance: `${BASE_URL}/api/wallet/balance/`,
  deposit: `${BASE_URL}/api/wallet/deposit/`,
  convert: `${BASE_URL}/api/wallet/convert/`,
  transactions: `${BASE_URL}/api/wallet/logs/`,
};

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
};

export const SUPPORTED_CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

// Frankfurter API for live rates (free, no key needed)
export const getLiveRates = async (baseCurrency = 'USD') => {
  const res = await fetch(
    `https://open.er-api.com/v6/latest/${baseCurrency}`
  );
  return res.json();
};

// Historical data for chart (last 90 days)
export const getHistoricalRates = async (from = 'EUR', to = 'USD') => {
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const res = await fetch(
    `https://api.frankfurter.app/${start}..${end}?from=${from}&to=${to}`
  );
  return res.json();
};