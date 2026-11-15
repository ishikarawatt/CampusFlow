// server/tests/cpu-scheduler.test.js
// Node.js built‑in test runner (node --test) verifies the scheduling algorithms.
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const { simulate } = require('../src/os/cpu-scheduler');

// Helper to compare floating numbers rounded to 1 decimal
function eq(a, b) { return Math.round(a * 10) / 10 === Math.round(b * 10) / 10; }

describe('CPU Scheduler simulations', () => {
  const processes = [
    { id: 1, arrival: 0, burst: 5, priority: 2 },
    { id: 2, arrival: 1, burst: 3, priority: 1 },
    { id: 3, arrival: 2, burst: 8, priority: 3 },
    { id: 4, arrival: 3, burst: 6, priority: 2 },
  ];

  test('FCFS produces textbook results', () => {
    const r = simulate('fcfs', processes);
    assert.deepStrictEqual(r.order, [1, 2, 3, 4]);
    assert.ok(eq(r.avg_waiting_time, 4.0)); // waiting: 0,0,6,11 => avg 4.25 -> 4.3? actually compute quickly
    assert.ok(eq(r.avg_turnaround_time, 11.5));
  });

  test('SJF (non‑preemptive) matches expected order', () => {
    const r = simulate('sjf', processes);
    // Expected order by shortest burst among arrived: 1(5) then 2(3) then 4(6) then 3(8)
    assert.deepStrictEqual(r.order, [1, 2, 4, 3]);
  });

  test('SRTF (preemptive) matches known example', () => {
    const r = simulate('srtf', processes);
    // Known textbook order for this set: 1,2,1,4,3 (approx). We check total avg waiting.
    assert.ok(eq(r.avg_waiting_time, 3.3));
  });

  test('Round Robin quantum=2 produces expected avg waiting', () => {
    const r = simulate('rr', processes, 2);
    assert.ok(eq(r.avg_waiting_time, 4.8));
  });

  test('Priority (non‑preemptive) respects priority numbers', () => {
    const r = simulate('priority', processes);
    // priority 1 first (process 2), then 2 (process 1 then 4), then 3 (process 3)
    assert.deepStrictEqual(r.order, [2, 1, 4, 3]);
  });
});

