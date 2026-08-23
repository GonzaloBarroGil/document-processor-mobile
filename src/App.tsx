import { useState, type FormEvent } from "react";

import { isAuthenticated, login, logout } from "./auth/auth";
import { capacitorCameraGateway, captureDocument } from "./capture/camera";
import { validateCaptureQuality } from "./capture/quality";
import { QueueStore } from "./queue/store";
import { apiUploader } from "./sync/uploader";
import { SyncEngine } from "./sync/sync-engine";

const store = new QueueStore();
const syncEngine = new SyncEngine(store, apiUploader);

export function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await login(username, password);
      setAuthenticated(true);
    } catch {
      setError("Invalid username or password");
    }
  }

  async function handleCapture() {
    setError(null);
    try {
      const captured = await captureDocument(capacitorCameraGateway);
      const quality = validateCaptureQuality({
        width: captured.width,
        height: captured.height,
        format: captured.format,
        sizeBytes: captured.sizeBytes,
      });
      if (!quality.ok) {
        setError(quality.errors.join(", "));
        return;
      }
      await store.add({ dataUrl: captured.dataUrl, type: "invoice", region: "AR" });
      setPendingCount(await store.countPending());
    } catch {
      setError("Capture failed");
    }
  }

  async function handleSync() {
    setError(null);
    await syncEngine.syncOnce();
    setPendingCount(await store.countPending());
  }

  function handleSignOut() {
    logout();
    setAuthenticated(false);
  }

  if (!authenticated) {
    return (
      <form onSubmit={handleLogin}>
        <h1>Sign in</h1>
        {error !== null && <p role="alert">{error}</p>}
        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit">Sign in</button>
      </form>
    );
  }

  return (
    <main>
      <h1>Document Processor</h1>
      <p aria-live="polite">{pendingCount} pending</p>
      {error !== null && <p role="alert">{error}</p>}
      <button type="button" onClick={handleCapture}>
        Capture
      </button>
      <button type="button" onClick={handleSync}>
        Sync
      </button>
      <button type="button" onClick={handleSignOut}>
        Sign out
      </button>
    </main>
  );
}
