// CPU scheduling simulator.
// simulate(algorithm, processes, quantum?) -> {order, gantt, avg_waiting_time, avg_turnaround_time, avg_response_time, cpu_utilization, throughput}
//   algorithm: 'fcfs' | 'priority' | 'sjf' | 'srtf' | 'rr'
//   processes: [{id, label, burst, priority, arrival}]
//   quantum: number (required for 'rr')
//   Waiting = first start - arrival. Turnaround = finish - arrival. Response = first start - arrival.
//   Averages rounded to 1 decimal.

function round1(n) { return Math.round(n * 10) / 10; }

function cmpId(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

function cloneProc(p) {
  return {
    id: p.id,
    label: p.label != null ? String(p.label) : String(p.id),
    burst: Number(p.burst),
    remaining: Number(p.burst),
    priority: p.priority != null ? Number(p.priority) : 99,
    arrival: p.arrival != null ? Number(p.arrival) : 0,
    firstStart: null,
    end: null,
  };
}

function simulate(algorithm, interviews, quantum) {
  const procs = (interviews || []).map(cloneProc);
  if (!procs.length) {
    return { order: [], gantt: [], avg_waiting_time: 0, avg_turnaround_time: 0, avg_response_time: 0, cpu_utilization: 0, throughput: 0 };
  }
  const gantt = [];
  const order = [];
  let time = 0;

  if (algorithm === 'fcfs') {
    const sorted = [...procs].sort((a, b) => a.arrival - b.arrival || cmpId(a.id, b.id));
    for (const p of sorted) {
      time = Math.max(time, p.arrival);
      p.firstStart = time;
      p.end = time + p.burst;
      gantt.push({ id: p.id, label: p.label, start: time, end: p.end });
      order.push(p.id);
      time = p.end;
    }
  } else if (algorithm === 'priority') {
    const done = new Set();
    time = Math.min(...procs.map(p => p.arrival));
    while (done.size < procs.length) {
      const candidates = procs.filter(p => !done.has(p.id) && p.arrival <= time)
        .sort((a, b) => a.priority - b.priority || a.arrival - b.arrival || cmpId(a.id, b.id));
      if (!candidates.length) {
        time = Math.min(...procs.filter(p => !done.has(p.id)).map(p => p.arrival));
        continue;
      }
      const p = candidates[0];
      p.firstStart = time;
      p.end = time + p.burst;
      gantt.push({ id: p.id, label: p.label, start: time, end: p.end });
      order.push(p.id);
      done.add(p.id);
      time = p.end;
    }
  } else if (algorithm === 'sjf') {
    // non‑preemptive shortest job first
    const done = new Set();
    time = Math.min(...procs.map(p => p.arrival));
    while (done.size < procs.length) {
      const candidates = procs.filter(p => !done.has(p.id) && p.arrival <= time)
        .sort((a, b) => a.burst - b.burst || a.arrival - b.arrival || cmpId(a.id, b.id));
      if (!candidates.length) {
        time = Math.min(...procs.filter(p => !done.has(p.id)).map(p => p.arrival));
        continue;
      }
      const p = candidates[0];
      p.firstStart = time;
      p.end = time + p.burst;
      gantt.push({ id: p.id, label: p.label, start: time, end: p.end });
      order.push(p.id);
      done.add(p.id);
      time = p.end;
    }
  } else if (algorithm === 'srtf') {
    // preemptive shortest remaining time first
    const ready = [];
    const arrived = [];
    const total = procs.length;
    let completed = 0;
    while (completed < total) {
      // bring newly arrived processes
      for (const p of procs) if (p.arrival <= time && !arrived.includes(p) && p.remaining > 0) arrived.push(p);
      // pick process with shortest remaining
      const candidates = arrived.filter(p => p.remaining > 0)
        .sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival || cmpId(a.id, b.id));
      if (!candidates.length) {
        // idle until next arrival
        const nextArr = Math.min(...procs.filter(p => p.remaining > 0).map(p => p.arrival));
        time = nextArr;
        continue;
      }
      const p = candidates[0];
      if (p.firstStart === null) p.firstStart = time;
      // run for 1 time unit (granularity)
      const exec = 1;
      const start = time;
      time += exec;
      p.remaining -= exec;
      gantt.push({ id: p.id, label: p.label, start, end: time });
      if (p.remaining === 0) {
        p.end = time;
        order.push(p.id);
        completed++;
      }
    }
  } else if (algorithm === 'rr') {
    if (!quantum || quantum <= 0) throw Object.assign(new Error('Quantum required for round robin'), { status: 400 });
    const queue = [];
    const arrived = [];
    const total = procs.length;
    let completed = 0;
    while (completed < total) {
      // enqueue newly arrived processes
      for (const p of procs) if (p.arrival <= time && !arrived.includes(p) && p.remaining > 0) { arrived.push(p); queue.push(p); }
      if (!queue.length) {
        // idle until next arrival
        const next = Math.min(...procs.filter(p => p.remaining > 0).map(p => p.arrival));
        time = next;
        continue;
      }
      const p = queue.shift();
      if (p.firstStart === null) p.firstStart = time;
      const slice = Math.min(quantum, p.remaining);
      const start = time;
      time += slice;
      p.remaining -= slice;
      gantt.push({ id: p.id, label: p.label, start, end: time });
      // enqueue newly arrived during this slice
      for (const np of procs) if (np.arrival > start && np.arrival <= time && !arrived.includes(np) && np.remaining > 0) { arrived.push(np); queue.push(np); }
      if (p.remaining > 0) queue.push(p);
      else { p.end = time; order.push(p.id); completed++; }
    }
  } else {
    throw Object.assign(new Error(`Unknown algorithm "${algorithm}". Use fcfs, priority, sjf, srtf, or rr.`), { status: 400 });
  }

  const n = procs.length;
  const avgWaiting = procs.reduce((s, p) => s + (p.firstStart - p.arrival), 0) / n;
  const avgTurnaround = procs.reduce((s, p) => s + (p.end - p.arrival), 0) / n;
  const avgResponse = procs.reduce((s, p) => s + (p.firstStart - p.arrival), 0) / n; // same as waiting for non‑preemptive
  const makespan = Math.max(...procs.map(p => p.end));
  const cpuUtil = (makespan ? (gantt.reduce((s, g) => s + (g.end - g.start), 0) / makespan) * 100 : 0);
  const throughput = n / (makespan || 1);

  return {
    order,
    gantt,
    avg_waiting_time: round1(avgWaiting),
    avg_turnaround_time: round1(avgTurnaround),
    avg_response_time: round1(avgResponse),
    cpu_utilization: round1(cpuUtil),
    throughput: round1(throughput),
  };
}

module.exports = { simulate };
