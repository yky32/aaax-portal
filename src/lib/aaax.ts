import { createPkce, randomState } from "./pkce";

export const CLIENT_ID = "aaax-portal";
const ISSUER_KEY = "aaax.issuer";
const TOKEN_KEY = "aaax_access_token";
const REFRESH_KEY = "aaax_refresh_token";
const VERIFIER_KEY = "aaax_pkce_verifier";
const STATE_KEY = "aaax_pkce_state";

export function getIssuer(): string {
  return (localStorage.getItem(ISSUER_KEY) || "http://localhost:8081").replace(/\/$/, "");
}

export function setIssuer(value: string): void {
  localStorage.setItem(ISSUER_KEY, value.replace(/\/$/, ""));
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export function isLoopbackIssuer(issuer = getIssuer()): boolean {
  try {
    const host = new URL(issuer).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

export function redirectUri(): string {
  return `${window.location.origin}/callback`;
}

type RBody = {
  code?: string;
  message?: string;
  data?: unknown;
};

export class AaaxError extends Error {
  status: number;
  code?: string;
  payload: unknown;
  constructor(status: number, payload: unknown) {
    const body = payload as RBody;
    super(body?.message || body?.code || `HTTP ${status}`);
    this.status = status;
    this.code = body?.code;
    this.payload = payload;
  }
}

export function isForbidden(err: unknown): boolean {
  if (!(err instanceof AaaxError)) return false;
  const code = err.code || "";
  return err.status === 403 || code === "SAU0403" || code.endsWith("0403");
}

export function formatErr(err: unknown): string {
  if (err instanceof AaaxError) {
    return `HTTP ${err.status}${err.code ? ` ${err.code}` : ""}\n${JSON.stringify(err.payload, null, 2)}`;
  }
  return JSON.stringify(err, null, 2);
}

function isRSuccess(code: string | undefined): boolean {
  if (!code) return false;
  return code === "SYS0000" || code.endsWith("0000");
}

export async function fetchRaw(path: string, init: RequestInit = {}): Promise<{ status: number; json: unknown }> {
  const issuer = getIssuer();
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  if (token && !headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
  const res = await fetch(`${issuer}${path}`, { ...init, headers });
  const text = await res.text();
  let json: unknown = text;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

export async function fetchR<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { status, json } = await fetchRaw(path, init);
  const body = json as RBody;
  if (body && typeof body.code === "string") {
    if (status >= 400 || !isRSuccess(body.code)) {
      throw new AaaxError(status, json);
    }
    return body.data as T;
  }
  if (status >= 400) throw new AaaxError(status, json);
  return json as T;
}

export async function startPkceLogin(): Promise<void> {
  const issuer = getIssuer();
  const meta = (await (await fetch(`${issuer}/.well-known/oauth-authorization-server`)).json()) as {
    authorization_endpoint?: string;
  };
  const authorize = meta.authorization_endpoint || `${issuer}/oauth2/authorize`;
  const { verifier, challenge } = await createPkce();
  const state = randomState();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  const url = new URL(authorize);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("scope", "openid");
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  window.location.assign(url.toString());
}

export async function completePkceLogin(search: string): Promise<unknown> {
  const params = new URLSearchParams(search);
  const err = params.get("error");
  if (err) throw { error: err, description: params.get("error_description") };
  const code = params.get("code");
  const state = params.get("state");
  if (!code) throw { error: "missing_code" };
  if (state !== sessionStorage.getItem(STATE_KEY)) throw { error: "state_mismatch" };
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw { error: "missing_verifier" };
  const issuer = getIssuer();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });
  const res = await fetch(`${issuer}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body,
  });
  const json = (await res.json()) as { access_token?: string; refresh_token?: string };
  if (!res.ok || !json.access_token) throw json;
  sessionStorage.setItem(TOKEN_KEY, json.access_token);
  if (json.refresh_token) sessionStorage.setItem(REFRESH_KEY, json.refresh_token);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return json;
}

export async function passwordGrant(opts: {
  username: string;
  credentials: string;
  clientId?: string;
  clientSecret?: string;
}): Promise<unknown> {
  if (!isLoopbackIssuer()) {
    throw { error: "password_grant_loopback_only" };
  }
  const clientId = opts.clientId || "client";
  const clientSecret = opts.clientSecret || "secret";
  const body = new URLSearchParams({
    grant_type: "custom-password-grant",
    username: opts.username,
    credentials: opts.credentials,
  });
  const res = await fetch(`${getIssuer()}/oauth2/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
      authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body,
  });
  const json = (await res.json()) as { access_token?: string; refresh_token?: string };
  if (!res.ok || !json.access_token) throw json;
  sessionStorage.setItem(TOKEN_KEY, json.access_token);
  if (json.refresh_token) sessionStorage.setItem(REFRESH_KEY, json.refresh_token);
  return json;
}
