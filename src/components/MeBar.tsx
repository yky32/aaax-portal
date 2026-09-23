import { useEffect, useState } from "react";
import { fetchR, formatErr, isForbidden } from "../lib/aaax";

export type Me = {
  id?: string;
  username?: string;
  status?: string;
  role?: string;
};

type Roles = { userId?: string; roles?: string[] };

export default function MeBar() {
  const [me, setMe] = useState<Me | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [mgt, setMgt] = useState<"ok" | "403" | "err" | "…">("…");
  const [err, setErr] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchR<Me>("/users/me");
        setMe(data);
      } catch (e) {
        setErr(formatErr(e));
        return;
      }
      try {
        const r = await fetchR<Roles>("/users/my-roles");
        setRoles(Array.isArray(r?.roles) ? r.roles : []);
      } catch {
        setRoles([]);
      }
      try {
        await fetchR("/mgt/users?page=1&size=1");
        setMgt("ok");
      } catch (e) {
        setMgt(isForbidden(e) ? "403" : "err");
      }
    })();
  }, []);

  return (
    <div className="mebar">
      <strong>me</strong>{" "}
      {me ? (
        <>
          <code>{me.username || "?"}</code>
          {me.id ? (
            <>
              {" "}
              · id <code>{me.id}</code>
            </>
          ) : null}
          {me.status ? ` · ${me.status}` : ""}
          {me.role ? ` · role ${me.role}` : ""}
          {roles.length ? ` · my-roles ${roles.join(",")}` : ""}
        </>
      ) : (
        <span className="muted">loading /users/me</span>
      )}
      <div className="muted" style={{ marginTop: "0.35rem" }}>
        /mgt/users probe:{" "}
        {mgt === "ok"
          ? "200 — this token can list users"
          : mgt === "403"
            ? "403 — not admin. Seed user cannot operate mgt/clients/rbac."
            : mgt === "err"
              ? "error"
              : "…"}
      </div>
      {err ? <pre className="out err">{err}</pre> : null}
    </div>
  );
}
