import { useState } from "react";
import { ForbiddenNote } from "../components/ForbiddenNote";
import { fetchR, fetchRaw, formatErr, isForbidden } from "../lib/aaax";

type ClientRow = { id?: string; clientId?: string; clientName?: string };

export default function Clients() {
  const [id, setId] = useState("aaax-portal");
  const [out, setOut] = useState("");
  const [createId, setCreateId] = useState("");
  const [createName, setCreateName] = useState("");
  const [err, setErr] = useState<unknown>(null);

  const dump = (label: string, value: unknown) => setOut(`${label}\n${JSON.stringify(value, null, 2)}`);

  async function lookup() {
    setErr(null);
    try {
      const data = await fetchR<ClientRow>(`/clients/${encodeURIComponent(id)}`);
      dump("GET /clients/{id}", data);
    } catch (e) {
      setErr(JSON.stringify(e, null, 2));
    }
  }

  async function create() {
    setErr(null);
    try {
      const data = await fetchR<ClientRow>("/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientId: createId,
          clientName: createName || createId,
          tokenExpiryTime: 3600,
        }),
      });
      dump("POST /clients", data);
    } catch (e) {
      setErr(JSON.stringify(e, null, 2));
    }
  }

  async function rotateSecret() {
    setErr(null);
    try {
      const { status, json } = await fetchRaw(`/clients/${encodeURIComponent(id)}`, { method: "PUT" });
      dump(`PUT /clients/{id} HTTP ${status}`, json);
    } catch (e) {
      setErr(JSON.stringify(e, null, 2));
    }
  }

  return (
    <section>
      <h1>Clients</h1>
      <p className="muted">
        Jar has no list-all. Lookup by id (seed: <code>client</code>, <code>aaax-pkce</code>, <code>aaax-portal</code>).
      </p>
      <div className="row">
        <label>
          client id
          <input value={id} onChange={(e) => setId(e.target.value)} />
        </label>
        <button className="btn primary" type="button" onClick={() => void lookup()}>
          Get
        </button>
        <button className="btn" type="button" onClick={() => void rotateSecret()}>
          Rotate secret
        </button>
      </div>
      <h2>Create</h2>
      <div className="row">
        <label>
          clientId
          <input value={createId} onChange={(e) => setCreateId(e.target.value)} />
        </label>
        <label>
          clientName
          <input value={createName} onChange={(e) => setCreateName(e.target.value)} />
        </label>
        <button className="btn" type="button" onClick={() => void create()}>
          POST /clients
        </button>
      </div>
      {isForbidden(err) ? <ForbiddenNote err={err} api="GET /clients/{id}" /> : null}
      {err && !isForbidden(err) ? <pre className="out err">{formatErr(err)}</pre> : null}
      {out ? <pre className="out">{out}</pre> : null}
    </section>
  );
}
