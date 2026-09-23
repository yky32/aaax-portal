import { useMemo, useState } from "react";
import {
  clearSession,
  getIssuer,
  getToken,
  isLoopbackIssuer,
  passwordGrant,
  setIssuer,
  startPkceLogin,
} from "./lib/aaax";
import Callback from "./pages/Callback";
import Clients from "./pages/Clients";
import Overview from "./pages/Overview";
import System from "./pages/System";
import Try from "./pages/Try";
import Users from "./pages/Users";

const NAV = ["overview", "clients", "users", "system", "try"] as const;
type Page = (typeof NAV)[number];

export default function App() {
  const [issuer, setIssuerField] = useState(getIssuer());
  const [page, setPage] = useState<Page>("overview");
  const [token, setToken] = useState(getToken());
  const [err, setErr] = useState("");
  const [user, setUser] = useState("smoke.primary@aaax.local");
  const [credentials, setCredentials] = useState("SmokePrimary!1");
  const onCallback = useMemo(() => window.location.pathname === "/callback", []);

  function saveIssuer() {
    setIssuer(issuer);
    window.location.reload();
  }

  if (onCallback) return <Callback />;

  return (
    <>
      <header className="top">
        <strong>AAAX portal</strong>
        <span className="muted">{issuer} · {token ? "signed in" : "no token"}</span>
      </header>
      <div className="shell">
        <nav className="side">
          {NAV.map((n) => (
            <button key={n} className={page === n ? "active" : ""} type="button" onClick={() => setPage(n)}>
              {n}
            </button>
          ))}
          {token ? (
            <button
              type="button"
              onClick={() => {
                clearSession();
                setToken(null);
              }}
            >
              sign out
            </button>
          ) : null}
        </nav>
        <main>
          <h2>Issuer</h2>
          <div className="row">
            <label>
              jar base URL
              <input value={issuer} onChange={(e) => setIssuerField(e.target.value)} />
            </label>
            <button className="btn" type="button" onClick={saveIssuer}>
              Save
            </button>
          </div>
          {!token ? (
            <>
              <p className="muted">PKCE public client aaax-portal → jar hosted /login.</p>
              <button className="btn primary" type="button" onClick={() => void startPkceLogin().catch((e) => setErr(JSON.stringify(e)))}>
                Sign in with PKCE
              </button>
              {isLoopbackIssuer(issuer) ? (
                <>
                  <h2>Local password grant</h2>
                  <p className="muted">Loopback only. Field is credentials= not password.</p>
                  <div className="row">
                    <label>
                      username
                      <input value={user} onChange={(e) => setUser(e.target.value)} />
                    </label>
                    <label>
                      credentials
                      <input type="password" value={credentials} onChange={(e) => setCredentials(e.target.value)} />
                    </label>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        setErr("");
                        void passwordGrant({ username: user, credentials })
                          .then(() => setToken(getToken()))
                          .catch((e) => setErr(JSON.stringify(e, null, 2)));
                      }}
                    >
                      Get token
                    </button>
                  </div>
                </>
              ) : null}
              {err ? <pre className="out err">{err}</pre> : null}
            </>
          ) : (
            <>
              {page === "overview" ? <Overview /> : null}
              {page === "clients" ? <Clients /> : null}
              {page === "users" ? <Users /> : null}
              {page === "system" ? <System /> : null}
              {page === "try" ? <Try /> : null}
            </>
          )}
          {!token && page === "overview" ? <Overview /> : null}
        </main>
      </div>
    </>
  );
}
