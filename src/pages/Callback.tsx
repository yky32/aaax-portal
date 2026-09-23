import { useEffect, useState } from "react";
import { completePkceLogin } from "../lib/aaax";

export default function Callback() {
  const [msg, setMsg] = useState("exchanging code…");

  useEffect(() => {
    void (async () => {
      try {
        await completePkceLogin(window.location.search);
        setMsg("signed in");
        window.history.replaceState({}, "", "/");
        window.location.assign("/");
      } catch (e) {
        setMsg(JSON.stringify(e, null, 2));
      }
    })();
  }, []);

  return (
    <section>
      <h1>Callback</h1>
      <pre className="out">{msg}</pre>
    </section>
  );
}
