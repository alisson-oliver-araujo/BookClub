// js/api.js
import { SUPABASE_URL } from "./config.js";
import { getAuthHeader } from "./auth.js";

const rest = (table) => `${SUPABASE_URL}/rest/v1/${table}`;

async function handleResponse(res) {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
}

export async function fetchList(table, params = "") {
    const headers = { ...getAuthHeader(), "Content-Type": "application/json" };
    const res = await fetch(`${rest(table)}${params}`, { headers });
    return handleResponse(res);
}

export async function fetchOne(table, id) {
    const headers = { ...getAuthHeader(), "Content-Type": "application/json" };
    const res = await fetch(`${rest(table)}?id=eq.${id}&limit=1`, { headers });
    return handleResponse(res);
}

//export async function createRecord(table, payload) {
//    const headers = { ...getAuthHeader(), "Content-Type": "application/json", Prefer: "return=representation" };
//    const res = await fetch(rest(table), {
//        method: "POST",
//        headers,
//        body: JSON.stringify(payload)
//    });
//    return handleResponse(res);
//}

export async function createRecord(table, payload) {
  // ler headers atualizados no momento da chamada
  const headers = {
    ...getAuthHeader(),
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };

  console.log("CREATE headers", headers);
  console.log("CREATE payload", payload);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log("CREATE status", res.status, "response", text);

  if (!res.ok) throw new Error(`CREATE ${table} failed: ${res.status} ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

export async function updateRecord(table, id, payload) {
    const headers = { ...getAuthHeader(), "Content-Type": "application/json", Prefer: "return=representation" };
    const res = await fetch(`${rest(table)}?id=eq.${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload)
    });
    return handleResponse(res);
}

export async function deleteRecord(table, id) {
    const headers = { ...getAuthHeader(), "Content-Type": "application/json" };
    const res = await fetch(`${rest(table)}?id=eq.${id}`, {
        method: "DELETE",
        headers
    });
    return handleResponse(res);
}