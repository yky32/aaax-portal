import { useEffect, useState } from "react";
import { fetchRaw, getIssuer } from "../lib/aaax";

type Chip = { id: string; label: string; ok: boolean | null; detail: string };

export default function Overview() {
  const issuer = getIssuer();
  const [chips, setChips] = useState<Chip[]>([
    { id: "8414", label: "RFC 8414", ok: null, detail: "" },
    { id: "oidc", label: "OIDC", ok: null, detail: "" },
    { id: "jwks", label: "JWKS", ok: null, detail: "" },
    { id: "health", label: "health", ok: null, detail: "" },
    { id: "keys", label: "public-keys", ok: null, detail: "" },
  ]);
  const [grants, setGrants] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      const next: Chip[] = [];
      const probe = async (id: string, label: string, path: string, pick?: (j: unknown) => string) => {
        try {
          const { status, json } = await fetchRaw(path);
          const ok = status >= 200 && status < 300;
          next.push({ id, label, ok, detail: pick ? pick(json) : String(status) });
          if (id === "8414" && json && typeof json === "object") {
            const g = (json as { grant_types_supported?: string[] }).grant_types_supported;
            if (g) setGrants(g);
          }
        } catch (e) {
          next.push({ id, label, ok: false, detail: String(e) });
        }
      };
      await probe("8414", "RFC 8414", "/.well-known/oauth-authorization-server", (j) =>
        String((j as { issuer?: string }).issuer || ""),
      );
      await probe("oidc", "OIDC", "/.well-known/openid-configuration", (j) =>
        String((j as { issuer?: string }).issuer || ""),
      );
      await probe("jwks", "JWKS", "/oauth2/jwks", (j) => {
        const keys = (j as { keys?: { kid?: string }[] }).keys || [];
        return keys.map((k) => k.kid || "?").join(", ") || String((j as { status?: number }).status || "ok");
      });
      await probe("health", "health", "/actuator/health", (j) => String((j as { status?: string }).status || ""));
      await probe("keys", "public-keys", "/keys/public-keys");
      setChips(next);
    })();
  }, [issuer]);

  return (
    <section>
      <h1>Overview</h1>
      <p className="muted">Live probes against {issuer}. This UI does not edit yml / JKS / Docker.</p>
      <div>
        {chips.map((c) => (
          <span key={c.id} className={`chip ${c.ok === true ? "up" : c.ok === false ? "down" : ""}`}>
            {c.label}
            {c.ok === true ? " up" : c.ok === false ? " down" : " …"}
            {c.detail ? ` · ${c.detail}` : ""}
          </span>
        ))}
      </div>
      <pre className="map">{`aaax-portal  (this UI)
        │  PKCE client aaax-portal / Bearer
        ▼
   AAAX jar  @ ${issuer}
   AS /oauth2/*     resource /users /mgt /clients
        │
   Postgres          Redis`}</pre>
      <h2>Grants (discovery)</h2>
      <p className="muted">QR/SMS custom_code is on disk, not on /oauth2/token.</p>
      <div>
        {grants.length === 0 ? <span className="muted">—</span> : grants.map((g) => <span key={g} className="chip">{g}</span>)}
      </div>
    </section>
  );
}
