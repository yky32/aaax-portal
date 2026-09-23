import { useState } from "react";
import { fetchR } from "../lib/aaax";

type User = {
  id?: string;
  username?: string;
  status?: string;
  alias?: string;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [err, setErr] = useState("");
  const [username, setUsername] = useState("");
  const [credentials, setCredentials] = useState("");

  async function load() {
    setErr("");
    try {
      const data = await fetchR<User[]>("/mgt/users?page=1&size=50");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(JSON.stringify(e, null, 2));
    }
  }

  async function register() {
    setErr("");
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
      setErr(JSON.stringify(e, null, 2));
    }
  }

  return (
    <section>
      <h1>Users</h1>
      <p className="muted">GET/POST /mgt/users — authenticated. Seed user may 403 if the jar has no mgt role.</p>
      <button className="btn primary" type="button" onClick={() => void load()}>
        Load
      </button>
      {err ? <pre className="out err">{err}</pre> : null}
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
              <td>{u.username}</td>
              <td>{u.status}</td>
              <td className="mono">{u.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
          POST
        </button>
      </div>
    </section>
  );
}
