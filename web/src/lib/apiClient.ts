let BASE = "";
export function setApiBase(url: string){ BASE = url.replace(/\/$/, ""); }

export async function get<T>(path: string){
  const r = await fetch(`${BASE}${path}`);
  if(!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}

export async function post<T>(path: string, body?: unknown){
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}
