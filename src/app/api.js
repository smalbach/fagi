// Llamadas a la API del servidor. Todo va al mismo origen (/api), con la
// cookie de login y la cabecera X-Fagi que el servidor exige en todo lo que
// cambia algo.

export class ApiError extends Error {
  constructor(status, code, data) {
    super(code ?? `http_${status}`);
    this.status = status;
    this.code = code ?? `http_${status}`;
    this.data = data;
  }
}

export async function api(method, url, body, { keepalive = false } = {}) {
  let res;
  try {
    res = await fetch(`/api${url}`, {
      method,
      credentials: 'same-origin',
      keepalive,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(method !== 'GET' ? { 'x-fagi': '1' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error, data);
  return data;
}

export const get = (url) => api('GET', url);
export const post = (url, body = {}, opts) => api('POST', url, body, opts);
export const del = (url) => api('DELETE', url);
