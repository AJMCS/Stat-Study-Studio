import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useConnection } from "../lib/connection";

/**
 * The notice that slides down from the top when the study service stops answering, with a button to try again,
 * and a brief "connected again" once it is back. The page itself keeps everything the learner was doing.
 */
export function ConnectionToast() {
  const { state, checking, reconnect } = useConnection();
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (state !== "lost") setTried(false);
  }, [state]);
  if (state === "ok") return null;
  return (
    <div className="toast-wrap">
      {state === "lost" ? (
        <div className="toast toast-lost" role="alert">
          <p>
            <b>Lost connection to the study service.</b> Your work on this page is kept, and the page reconnects by itself as soon as the service is back.
          </p>
          {tried && <p className="muted">Still no answer. If you closed the app's black window, start Stats Study Studio again; this page will pick it up.</p>}
          <div className="row">
            <button
              disabled={checking}
              onClick={() => {
                void reconnect().then((ok) => setTried(!ok));
              }}
            >
              {checking ? "Checking…" : "Reconnect now"}
            </button>
            <Link to="/settings" className="button ghost">
              Settings
            </Link>
          </div>
        </div>
      ) : (
        <div className="toast toast-back" role="status">
          <p>
            <b>Connected again.</b> Anything that could not be saved has been saved now.
          </p>
        </div>
      )}
    </div>
  );
}
