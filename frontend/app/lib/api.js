// A simple wrapper around fetch to call our backend API.
export async function api(path, init = {}) {
  const res = await fetch(`/api/backend/${path.replace(/^\/+/, "")}`, {
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

// Example resource wrappers (pure JS):
export const Metadata = {
  list: () => api("metadata/"),
  retrieve: (id) => api(`metadata/${id}/`),
  create: (data) =>
    api("metadata/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    api(`metadata/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  remove: (id) => api(`metadata/${id}/`, { method: "DELETE" }),
};
