const API_BASE = "http://localhost:5050";

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function setSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // response body wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }

  return res;
}

export async function apiGet(path) {
  const res = await request(path);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await request(path, { method: "POST", body: JSON.stringify(body) });
  return res.json();
}

export async function apiPatch(path, body) {
  const res = await request(path, { method: "PATCH", body: JSON.stringify(body) });
  return res.json();
}

export async function apiDelete(path) {
  const res = await request(path, { method: "DELETE" });
  return res.json();
}

// Streams a file response (e.g. CSV export) to the browser's download flow.
export async function apiDownload(path, filename) {
  const res = await request(path);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
