'use strict';

const SeedRunner = require("@database/seed-runner");
const seeds = require("@database/seeds");

describe("SeedRunner & Database Seeds", () => {
  test("validates seeds structure and unique IDs", () => {
    expect(Array.isArray(seeds)).toBe(true);
    expect(seeds.length).toBeGreaterThanOrEqual(3);

    const ids = seeds.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);

    seeds.forEach(seed => {
      expect(typeof seed.id).toBe("string");
      expect(typeof seed.run).toBe("function");
    });
  });

  test("runs seeds idempotently using mock connection pool", async () => {
    const executedQueries = [];
    const mockConnection = {
      query: jest.fn(async (sql, params) => {
        executedQueries.push({ sql, params });
        if (sql.includes("GET_LOCK")) {
          return [[{ acquired: 1 }]];
        }
        return [[]];
      }),
      release: jest.fn()
    };

    const mockPool = {
      getConnection: jest.fn(async () => mockConnection)
    };

    const runner = new SeedRunner({ pool: mockPool });
    const result = await runner.run();

    expect(result.executed).toEqual([
      "001-seed-agent-runtime-states",
      "002-seed-agent-autonomy",
      "003-seed-sop-playbooks"
    ]);
    expect(mockConnection.release).toHaveBeenCalled();
  });

  test("throws TypeError if pool is missing or seed ID duplicate", () => {
    expect(() => new SeedRunner()).toThrow(TypeError);
    expect(() => new SeedRunner({
      pool: {},
      seedList: [{ id: "dup", run: async () => {} }, { id: "dup", run: async () => {} }]
    })).toThrow("Seed IDs must be unique");
  });
});
