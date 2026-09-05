'use strict';

const BasePolicy = require("@policy/BasePolicy");

describe("BasePolicy", () => {
  test("instantiates with default options and allows by default", () => {
    const policy = new BasePolicy({ name: "TestPolicy", version: "2.0.0" });
    expect(policy.name).toBe("TestPolicy");
    expect(policy.version).toBe("2.0.0");
    expect(policy.enabled).toBe(true);

    const result = policy.evaluate();
    expect(result.allowed).toBe(true);
    expect(result.policy).toBe("TestPolicy");
  });

  test("enforces evaluation and throws PolicyViolationError on failure", () => {
    class StrictPolicy extends BasePolicy {
      evaluate(ctx) {
        if (!ctx.authenticated) {
          return this.deny("Authentication required");
        }
        return this.allow();
      }
    }

    const policy = new StrictPolicy({ name: "StrictPolicy" });
    expect(() => policy.enforce({ authenticated: false })).toThrow(
      BasePolicy.PolicyViolationError
    );

    const allowed = policy.enforce({ authenticated: true });
    expect(allowed.allowed).toBe(true);
  });

  test("validates required context keys", () => {
    const policy = new BasePolicy();
    expect(() => policy.validateContext(null)).toThrow(TypeError);
    expect(() => policy.validateContext({}, ["userId"])).toThrow(TypeError);
    expect(() => policy.validateContext({ userId: "u123" }, ["userId"])).not.toThrow();
  });
});
