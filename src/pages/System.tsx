import { useState } from "react";
import { fetchR, fetchRaw } from "../lib/aaax";

type Cfg = { id?: string; name?: string; target?: string; scope?: string; value?: unknown };

export default function System() {
  const [rows, setRows] = useState<Cfg[]>([]);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [value, setValue] = useState("");
  const [hk, setHk] = useState("");

  async function load() {
    setErr("");
    try {
      const data = await fetchR<Cfg[]>("/system-configurations");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(JSON.stringify(e, null, 2));
    }
  }

  async function create() {
    setErr("");
    try {
      let parsed: unknown = value;
      try {
        parsed = value ? JSON.parse(value) : value;
      } catch {
        parsed = value;
      }
      await fetchR("/system-configurations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, target, value: parsed }),
      });
      await load();
    } catch (e) {
      setErr(JSON.stringify(e, null, 2));
    }
  }

  async function housekeeping() {
    if (!window.confirm("DELETE /operations/housekeeping/user-tokens on the live jar?")) return;
    setErr("");
    try {
      const { status, json } = await fetchRaw("/operations/housekeeping/user-tokens", { method: "DELETE" });
      setHk(`HTTP ${status}\n${JSON.stringify(json, null, 2)}`);
    } catch (e) {
      setErr(JSON.stringify(e, null, 2));
    }
  }

  return (
    <section>
      <h1>System</h1>
      <p className="muted">Runtime rows via /system-configurations. Env / JKS stay on the host.</p>
      <button className="btn primary" type="button" onClick={() => void load()}>
        Load
      </button>
      {err ? <pre className="out err">{err}</pre> : null}
      <table>
        <thead>
          <tr>
            <th>name</th>
            <th>target</th>
            <th>id</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id || r.name}>
              <td>{r.name}</td>
              <td>{r.target}</td>
              <td className="mono">{r.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Create</h2>
      <div className="row">
        <label>
          name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          target
          <input value={target} onChange={(e) => setTarget(e.target.value)} />
        </label>
      </div>
      <label>
        value (JSON or string)
        <textarea rows={3} value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      <button className="btn" type="button" onClick={() => void create()}>
        POST
      </button>
      <h2>Housekeeping</h2>
      <button className="btn" type="button" onClick={() => void housekeeping()}>
        Delete user tokens
      </button>
      {hk ? <pre className="out">{hk}</pre> : null}
    </section>
  );
}
