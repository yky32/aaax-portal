import { useEffect, useState } from "react";
import { fetchRaw, getIssuer, getToken } from "../lib/aaax";

type Op = { method: string; path: string };

export default function Try() {
  const [ops, setOps] = useState<Op[]>([]);
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/users/me");
  const [body, setBody] = useState("");
  const [out, setOut] = useState("");
  const issuer = getIssuer();

  useEffect(() => {
    void (async () => {
      try {
        const { status, json } = await fetchRaw("/v3/api-docs");
        if (status >= 400 || !json || typeof json !== "object") {
          setOps([
            { method: "GET", path: "/.well-known/oauth-authorization-server" },
            { method: "GET", path: "/users/me" },
            { method: "GET", path: "/mgt/users" },
            { method: "GET", path: "/system-configurations" },
          ]);
          return;
        }
        const paths = (json as { paths?: Record<string, Record<string, unknown>> }).paths || {};
        const list: Op[] = [];
        for (const [p, methods] of Object.entries(paths)) {
          for (const m of Object.keys(methods)) {
            if (["get", "post", "put", "patch", "delete"].includes(m)) {
              list.push({ method: m.toUpperCase(), path: p });
            }
          }
        }
        list.sort((a, b) => a.path.localeCompare(b.path));
        setOps(list);
      } catch {
        setOps([{ method: "GET", path: "/users/me" }]);
      }
    })();
  }, [issuer]);

  async function run() {
    const init: RequestInit = { method };
    if (body && method !== "GET") {
      init.headers = { "content-type": "application/json" };
      init.body = body;
    }
    const { status, json } = await fetchRaw(path, init);
    setOut(`HTTP ${status}\n${JSON.stringify(json, null, 2)}`);
  }

  return (
    <section>
      <h1>Try</h1>
      <p className="muted">
        Catalog from {issuer}/v3/api-docs. Exhaustive UI:{" "}
        <a href={`${issuer}/swagger-ui/index.html`}>swagger-ui</a>
        {getToken() ? "" : " · no Bearer yet"}
      </p>
      <div className="row">
        <label>
          method
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          path
          <input value={path} onChange={(e) => setPath(e.target.value)} />
        </label>
        <button className="btn primary" type="button" onClick={() => void run()}>
          Call
        </button>
      </div>
      {method !== "GET" ? (
        <label>
          JSON body
          <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
      ) : null}
      {out ? <pre className="out">{out}</pre> : null}
      <h2>OpenAPI</h2>
      <table>
        <thead>
          <tr>
            <th>method</th>
            <th>path</th>
          </tr>
        </thead>
        <tbody>
          {ops.slice(0, 80).map((op) => (
            <tr key={`${op.method}${op.path}`}>
              <td>
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setMethod(op.method);
                    setPath(op.path);
                  }}
                >
                  {op.method}
                </button>
              </td>
              <td className="mono">{op.path}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
