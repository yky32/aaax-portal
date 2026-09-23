import { formatErr, isForbidden } from "../lib/aaax";

export function ForbiddenNote({ err, api }: { err: unknown; api: string }) {
  if (!err) return null;
  if (isForbidden(err)) {
    return (
      <div className="banner">
        Signed in, but <code>{api}</code> returned 403. Seed user is not an admin — AAAX has no bootstrap{" "}
        <code>ROLE_ADMIN</code>. This is not an empty table.
        <pre className="out err" style={{ marginTop: "0.6rem" }}>
          {formatErr(err)}
        </pre>
      </div>
    );
  }
  return <pre className="out err">{formatErr(err)}</pre>;
}
