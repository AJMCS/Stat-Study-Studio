import { describe, expect, it } from "vitest";
import { ServiceRejected, readRejection } from "./api";

describe("reading the service's refusal", () => {
  it("keeps the message and the kind, and for a workspace choice the workspaces to pick from", () => {
    const e = readRejection(409, {
      detail: "This key can work in several workspaces. Which one should the app use?",
      kind: "workspace_choice",
      workspaces: [{ id: "wrkspc_01Default", name: "Default Workspace" }, { id: "wrkspc_01Unnamed", name: "" }, { nope: 1 }, null, "wrkspc_01Text"],
    });
    expect(e).toBeInstanceOf(ServiceRejected);
    expect(e.status).toBe(409);
    expect(e.kind).toBe("workspace_choice");
    expect(e.message).toContain("Which one should the app use?");
    // an unnamed workspace is shown by its ID; entries that are not workspaces are dropped, never shown as "undefined"
    expect(e.workspaces).toEqual([
      { id: "wrkspc_01Default", name: "Default Workspace" },
      { id: "wrkspc_01Unnamed", name: "wrkspc_01Unnamed" },
    ]);
  });

  it("carries no workspaces for other refusals", () => {
    const e = readRejection(409, { detail: "This key is not tied to a workspace.", kind: "workspace_needed" });
    expect(e.kind).toBe("workspace_needed");
    expect(e.workspaces).toBeUndefined();
    expect(readRejection(401, { detail: "bad key", kind: "invalid_key" }).workspaces).toBeUndefined();
  });

  it("falls back to a generic message when the body is missing or not an object", () => {
    for (const body of [null, "oops", 42, { detail: 7, kind: null }]) {
      const e = readRejection(500, body);
      expect(e.message).toBe("The study service returned an error (500).");
      expect(e.kind).toBeUndefined();
      expect(e.workspaces).toBeUndefined();
    }
  });
});
