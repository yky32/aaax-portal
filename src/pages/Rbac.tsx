import { useState } from "react";
import { ForbiddenNote } from "../components/ForbiddenNote";
import { fetchR, formatErr, isForbidden } from "../lib/aaax";

type Template = {
  id?: string;
  name?: string;
  description?: string;
  permissions?: unknown;
};

const PREDEFINED = ["admin", "normal"] as const;

export default function Rbac() {
  const [rows, setRows] = useState<Template[]>([]);
  const [err, setErr] = useState<unknown>(null);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionsJson, setPermissionsJson] = useState("{}");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<(typeof PREDEFINED)[number]>("normal");
  const [note, setNote] = useState("");

  async function load() {
    setErr(null);
    setNote("");
    try {
      const data = await fetchR<Template[]>("/rbac-templates?page=1&size=50");
      setRows(Array.isArray(data) ? data : []);
      setLoaded(true);
    } catch (e) {
      setRows([]);
      setLoaded(true);
      setErr(e);
    }
  }

  async function create() {
    setErr(null);
    let permissions: unknown = {};
    try {
      permissions = JSON.parse(permissionsJson || "{}");
    } catch {
      setErr({ message: "permissions must be JSON" });
      return;
    }
    try {
      await fetchR("/rbac-templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description, permissions }),
      });
      setName("");
      setDescription("");
      await load();
    } catch (e) {
      setErr(e);
    }
  }

  async function assign() {
    setErr(null);
    setNote("");
    try {
      const data = await fetchR(`/users/${encodeURIComponent(userId)}/roles`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roles: [role] }),
      });
      setNote(JSON.stringify(data, null, 2));
    } catch (e) {
      setErr(e);
    }
  }

  const blocked = isForbidden(err);

  return (
    <section>
      <h1>RBAC</h1>
      <p className="muted">
        Templates: <code>/rbac-templates</code>. Assign role: <code>POST /users/{"{userId}"}/roles</code> — jar only
        accepts <code>admin</code> or <code>normal</code> (hardcoded).
      </p>
      <button className="btn primary" type="button" onClick={() => void load()}>
        Load templates
      </button>
      <ForbiddenNote err={isForbidden(err) ? err : null} api="GET /rbac-templates" />
      {loaded && !blocked ? (
        <table>
          <thead>
            <tr>
              <th>name</th>
              <th>description</th>
              <th>id</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id || r.name}>
                <td>{r.name}</td>
                <td>{r.description}</td>
                <td className="mono">{r.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {loaded && !blocked && rows.length === 0 ? <p className="muted">No templates.</p> : null}

      <h2>Create template</h2>
      <div className="row">
        <label>
          name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          description
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
      </div>
      <label>
        permissions JSON
        <textarea rows={4} value={permissionsJson} onChange={(e) => setPermissionsJson(e.target.value)} />
      </label>
      <button className="btn" type="button" onClick={() => void create()}>
        POST /rbac-templates
      </button>

      <h2>Assign predefined role</h2>
      <div className="row">
        <label>
          userId
          <input value={userId} onChange={(e) => setUserId(e.target.value)} />
        </label>
        <label>
          role
          <select value={role} onChange={(e) => setRole(e.target.value as (typeof PREDEFINED)[number])}>
            {PREDEFINED.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <button className="btn" type="button" onClick={() => void assign()}>
          POST /users/{"{id}"}/roles
        </button>
      </div>
      {note ? <pre className="out">{note}</pre> : null}
      {err && !isForbidden(err) ? <pre className="out err">{formatErr(err)}</pre> : null}
    </section>
  );
}
