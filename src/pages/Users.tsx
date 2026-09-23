import { useState } from "react";
import { ForbiddenNote } from "../components/ForbiddenNote";
import { fetchR, formatErr, isForbidden } from "../lib/aaax";

type User = {
  id?: string;
  username?: string;
  status?: string;
};

type Log = {
  id?: string;
  event?: string;
  type?: string;
  createDt?: string;
};

const STATUSES = ["ACTIVE", "PENDING_VERIFY", "SUSPENDED", "INACTIVE"];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [err, setErr] = useState<unknown>(null);
  const [loaded, setLoaded] = useState(false);
  const [username, setUsername] = useState("");
  const [credentials, setCredentials] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newCredentials, setNewCredentials] = useState("");
  const [existingCredentials, setExistingCredentials] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [logs, setLogs] = useState<Log[]>([]);
  const [note, setNote] = useState("");

  async function load() {
    setErr(null);
    setNote("");
    try {
      const data = await fetchR<User[]>("/mgt/users?page=1&size=50");
      setUsers(Array.isArray(data) ? data : []);
      setLoaded(true);
    } catch (e) {
      setUsers([]);
      setLoaded(true);
      setErr(e);
    }
  }

  async function register() {
    setErr(null);
    try {
      await fetchR("/mgt/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, credentials }),
      });
      setUsername("");
      setCredentials("");
      await load();
    } catch (e) {
      setErr(e);
    }
  }

  const ident = selected?.username || "";

  async function patchStatus() {
    setErr(null);
    try {
      await fetchR(`/mgt/users/${encodeURIComponent(ident)}/statuses`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setNote(`status → ${status}`);
      await load();
    } catch (e) {
      setErr(e);
    }
  }

  async function patchUsername() {
    setErr(null);
    try {
      await fetchR(`/mgt/users/${encodeURIComponent(ident)}/username`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });
      setNote(`username → ${newUsername}`);
      setSelected({ ...selected, username: newUsername });
      await load();
    } catch (e) {
      setErr(e);
    }
  }

  async function patchCredentials() {
    setErr(null);
    try {
      await fetchR(`/mgt/users/${encodeURIComponent(ident)}/credentials`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credentials: newCredentials, existingCredentials }),
      });
      setNote("credentials updated");
      setNewCredentials("");
      setExistingCredentials("");
    } catch (e) {
      setErr(e);
    }
  }

  async function loadLogs() {
    if (!selected?.id) return;
    setErr(null);
    try {
      const data = await fetchR<Log[]>(
        `/mgt/users/${encodeURIComponent(selected.id)}/authentication-logs?page=1&size=20`,
      );
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e);
    }
  }

  async function softDelete() {
    if (!ident) return;
    if (!window.confirm(`Soft-delete ${ident}?`)) return;
    setErr(null);
    try {
      const msg = await fetchR<string>(
        `/mgt/users/identifier/${encodeURIComponent(ident)}?isSoftDelete=true`,
        { method: "DELETE" },
      );
      setNote(typeof msg === "string" ? msg : "deleted");
      setSelected(null);
      await load();
    } catch (e) {
      setErr(e);
    }
  }

  const blocked = isForbidden(err);

  return (
    <section>
      <h1>Users</h1>
      <p className="muted">
        <code>GET/POST /mgt/users</code> · patch status / username / credentials · auth logs · soft delete. Identifier =
        current username.
      </p>
      <button className="btn primary" type="button" onClick={() => void load()}>
        Load
      </button>
      <ForbiddenNote err={isForbidden(err) ? err : null} api="GET /mgt/users" />
      {err && !isForbidden(err) ? <pre className="out err">{formatErr(err)}</pre> : null}
      {note ? <p className="muted">{note}</p> : null}
      {loaded && !blocked ? (
        <table>
          <thead>
            <tr>
              <th>username</th>
              <th>status</th>
              <th>id</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id || u.username}>
                <td>
                  <button className="btn" type="button" onClick={() => setSelected(u)}>
                    {u.username}
                  </button>
                </td>
                <td>{u.status}</td>
                <td className="mono">{u.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {loaded && !blocked && users.length === 0 ? <p className="muted">No rows.</p> : null}

      <h2>Register</h2>
      <div className="row">
        <label>
          username
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          credentials
          <input type="password" value={credentials} onChange={(e) => setCredentials(e.target.value)} />
        </label>
        <button className="btn" type="button" onClick={() => void register()}>
          POST /mgt/users
        </button>
      </div>

      {selected ? (
        <>
          <h2>
            Selected <code>{selected.username}</code>
          </h2>
          <div className="row">
            <label>
              status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <button className="btn" type="button" onClick={() => void patchStatus()}>
              PATCH statuses
            </button>
          </div>
          <div className="row">
            <label>
              new username
              <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            </label>
            <button className="btn" type="button" onClick={() => void patchUsername()}>
              PATCH username
            </button>
          </div>
          <div className="row">
            <label>
              existingCredentials
              <input
                type="password"
                value={existingCredentials}
                onChange={(e) => setExistingCredentials(e.target.value)}
              />
            </label>
            <label>
              credentials
              <input type="password" value={newCredentials} onChange={(e) => setNewCredentials(e.target.value)} />
            </label>
            <button className="btn" type="button" onClick={() => void patchCredentials()}>
              PATCH credentials
            </button>
          </div>
          <div className="row">
            <button className="btn" type="button" onClick={() => void loadLogs()}>
              Auth logs
            </button>
            <button className="btn" type="button" onClick={() => void softDelete()}>
              Soft delete
            </button>
          </div>
          {logs.length ? (
            <table>
              <thead>
                <tr>
                  <th>event</th>
                  <th>type</th>
                  <th>createDt</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{l.event}</td>
                    <td>{l.type}</td>
                    <td className="mono">{l.createDt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
