import { describe, it, expect } from "vitest";
import { assessClaimStatus } from "../claim-assessor";

describe("claim-assessor", () => {
  it("returns HOLDING when no threatening evidence", () => {
    const status = assessClaimStatus({ evidenceFor: 3, evidenceAgainst: 0 });
    expect(status).toBe("HOLDING");
  });

  it("returns UNDER_PRESSURE when some threatening evidence", () => {
    const status = assessClaimStatus({ evidenceFor: 3, evidenceAgainst: 2 });
    expect(status).toBe("UNDER_PRESSURE");
  });

  it("returns CONTESTED when evidence against exceeds evidence for", () => {
    const status = assessClaimStatus({ evidenceFor: 1, evidenceAgainst: 3 });
    expect(status).toBe("CONTESTED");
  });

  it("returns HOLDING when no evidence at all", () => {
    const status = assessClaimStatus({ evidenceFor: 0, evidenceAgainst: 0 });
    expect(status).toBe("HOLDING");
  });
});
