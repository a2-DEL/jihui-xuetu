import assert from "node:assert/strict";
import { PERMISSION_SCENARIOS } from "../src/lib/platform/access-control-store";
import { DEMO_IDENTITIES, toActorContext } from "../src/lib/platform/demo-identities";
import { evaluateNineDimensionPermission } from "../src/lib/platform/nine-dimension-engine";

const expected: Record<string, { status: string; dimension?: string }> = {
  "student-own-application-read": { status: "ALLOW" },
  "student-cross-owner-read": { status: "DENY", dimension: "organization" },
  "counselor-own-class-review": { status: "ALLOW" },
  "counselor-cross-class-review": { status: "DENY", dimension: "organization" },
  "finance-core-zone-disbursement": { status: "ALLOW" },
  "finance-remote-disbursement": { status: "DENY", dimension: "geography" },
  "fund-admin-agent-l4-review": { status: "DENY", dimension: "ai-risk" },
  "counselor-agent-unregistered-tool": { status: "DENY", dimension: "ai-risk" },
  "data-admin-business-update": { status: "DENY", dimension: "data-scope" },
  "discipline-p5-authorized-read": { status: "ALLOW" },
};
let dimensionEvaluations = 0;
for (const scenario of PERMISSION_SCENARIOS) {
  const identity = DEMO_IDENTITIES.find((item) => item.id === scenario.actorId);
  assert(identity, `Missing actor ${scenario.actorId}`);
  const decision = evaluateNineDimensionPermission(toActorContext(identity), scenario.request);
  assert.equal(decision.dimensions.length, 9, `${scenario.id} must evaluate nine dimensions`);
  assert.equal(decision.status, expected[scenario.id]?.status, `${scenario.id} status`);
  if (expected[scenario.id]?.dimension) assert(decision.deniedBy.includes(expected[scenario.id].dimension as never), `${scenario.id} must be denied by ${expected[scenario.id].dimension}`);
  if (scenario.request.actorType === "agent") {
    assert(decision.formula, `${scenario.id} requires Agent formula evidence`);
    assert.equal(decision.formula.components.length, 7);
  }
  dimensionEvaluations += decision.dimensions.length;
}
assert.equal(PERMISSION_SCENARIOS.length, 10);
assert.equal(dimensionEvaluations, 90);
console.log(`nine_dimension_scenarios=${PERMISSION_SCENARIOS.length}`);
console.log(`dimension_evaluations=${dimensionEvaluations}`);
console.log("agent_formula_and_expected_denials=passed");
