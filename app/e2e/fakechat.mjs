// A stand-in for the Anthropic and OpenAI APIs (told apart by how the key is sent) for the browser tests.
import { createServer } from "node:http";

export const CHAT_KEY = "sk-good-key";

const scores = () => ({
  core: { score: 80, feedback: "The hosted model saw the central idea.", suggestion: "Be specific." },
  depth: { score: 78, feedback: "Reasoning was given.", suggestion: "Add a step." },
  relevance: { score: 76, feedback: "Purpose was mentioned.", suggestion: "Say what it decides." },
  application: { score: 74, feedback: "An example helped.", suggestion: "Add another." },
});

const NOT_SCOPED =
  "This API key is not scoped to a workspace, so this request must include the anthropic-workspace-id header with the ID of the workspace to use. Add the header, or use an API key that is scoped to a workspace.";

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => resolve(raw));
  });

export function startFakeChat() {
  const log = [];
  // Anthropic keys made for every workspace of the organisation (mirrors backend/tests/fakeapis.py). A test sets the
  // mode with POST /__workspace {require, workspaces: [{id, name, default?}], forbidden}: with `require` on, the API
  // answers the real 400 unless the request names one of `workspaces` (an unknown one gets the 404), and listing them
  // at /v1/organizations/workspaces answers 403 when `forbidden`. Every logged request records its `workspace` header.
  let ws = { require: false, workspaces: [], forbidden: false };
  const server = createServer(async (req, res) => {
    const send = (code, obj) => {
      const body = JSON.stringify(obj);
      res.writeHead(code, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
      res.end(body);
    };
    if (req.url === "/__log") return send(200, log);
    if (req.url === "/__workspace") {
      ws = { require: false, workspaces: [], forbidden: false, ...JSON.parse((await readBody(req)) || "{}") };
      return send(200, ws);
    }
    const anthropic = req.headers["x-api-key"] !== undefined;
    const key = anthropic ? req.headers["x-api-key"] : (req.headers.authorization ?? "").replace("Bearer ", "");
    if (key !== CHAT_KEY) return send(401, { error: { message: "invalid key", code: "invalid_api_key" } });
    const workspace = req.headers["anthropic-workspace-id"] ?? null;
    const workspaceOk = () => {
      if (!anthropic || !ws.require) return true;
      if (workspace === null) return send(400, { type: "error", error: { type: "invalid_request_error", message: NOT_SCOPED } }), false;
      if (!workspace.startsWith("wrkspc_")) return send(400, { type: "error", error: { type: "invalid_request_error", message: "anthropic-workspace-id header must be a valid workspace ID." } }), false;
      if (!ws.workspaces.some((w) => w.id === workspace)) return send(404, { type: "error", error: { type: "not_found_error", message: `Workspace \`${workspace}\` not found.` } }), false;
      return true;
    };
    if (req.method === "GET") {
      if (anthropic && req.url.startsWith("/v1/organizations/workspaces")) {
        if (ws.forbidden) return send(403, { type: "error", error: { type: "permission_error", message: "This API key does not have permission to list workspaces." } });
        const withDefault = req.url.includes("include_default=true");
        return send(200, { data: ws.workspaces.filter((w) => withDefault || !w.default).map((w) => ({ archived_at: null, ...w })), has_more: false });
      }
      if (!workspaceOk()) return;
      return send(200, { data: (anthropic ? ["claude-opus-5-5", "claude-haiku-4-5"] : ["gpt-5.4-mini", "gpt-5.5"]).map((id) => ({ id })) });
    }
    const raw = await readBody(req);
    if (!workspaceOk()) return;
    log.push({ kind: anthropic ? "anthropic" : "openai", workspace, ...JSON.parse(raw) });
    const text = JSON.stringify(scores());
    send(200, anthropic ? { content: [{ type: "text", text }], stop_reason: "end_turn" } : { choices: [{ message: { role: "assistant", content: text }, finish_reason: "stop" }] });
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })),
  );
}
