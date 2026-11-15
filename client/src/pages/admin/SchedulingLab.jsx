// Scheduling Lab — OS-grade algorithmic timetable generator.
// Shortlisted students → ordered by Priority (Highest CGPA) or FCFS (Application Order).
// Lab reservation safety check + simulated algorithm turnaround time comparison.

import React, { useEffect, useState } from 'react';
import { schedule as scheduleApi, drives as drivesApi, errMsg } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';
import { formatDate } from '../../utils.js';
import PageHeader from '../../components/PageHeader.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import StatCard from '../../components/StatCard.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { Calendar, Clock, Sparkles, RefreshCw, BarChart2, ShieldCheck, AlertCircle } from 'lucide-react';

const ALGOS = [
  {
    id: 'priority',
    label: 'Highest Marks First (Priority)',
    desc: 'Candidates with top CGPA and assessment scores interview first.',
  },
  {
    id: 'fcfs',
    label: 'Application Order (FCFS)',
    desc: 'Candidates are scheduled in the exact sequential order they applied.',
  },
];

function toLocalInput(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function SchedulingLab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [driveId, setDriveId] = useState('');
  const [algo, setAlgo] = useState('priority');
  const [minutes, setMinutes] = useState(15);
  const [startsAt, setStartsAt] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [compare, setCompare] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await drivesApi.list();
        const list = data ?? [];
        setDrives(list);
        const first = list.find((d) => (d.counts?.shortlisted ?? 0) > 0) ?? list[0];
        if (first) {
          setDriveId(String(first.id));
          setMinutes(first.interview_duration_min || 15);
          const base = first.interview_date ? new Date(first.interview_date) : new Date();
          base.setHours(10, 0, 0, 0);
          setStartsAt(toLocalInput(base));
        }
      } catch (err) {
        toast(errMsg(err, 'Could not load drives.'), 'error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = drives.find((d) => String(d.id) === String(driveId));

  const generate = async () => {
    if (!driveId) return;
    setRunning(true);
    setResult(null);
    setCompare(null);
    try {
      const { data } = await scheduleApi.auto({
        drive_id: Number(driveId),
        algorithm: algo,
        interview_minutes: Number(minutes),
        starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
      });
      setResult(data);
      toast(`Timetable ready — ${data.timeline.length} interviews scheduled.`, 'success');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        try {
          const { data: existing } = await scheduleApi.getAuto(driveId);
          setResult({ existing: existing.slots ?? [], already: true });
        } catch (_) {}
      }
      toast(errMsg(err, 'Could not generate the timetable.'), 'error');
    } finally {
      setRunning(false);
    }
  };

  const compareAlgos = async () => {
    if (!result?.students?.length) return;
    setComparing(true);
    try {
      const mk = (a) =>
        result.students.map((s, i) => ({
          id: i + 1,
          label: s.name,
          burst: result.interview_minutes,
          priority: a === 'priority' ? Math.round((10 - s.cgpa) * 100) : 0,
          arrival: a === 'fcfs' ? i : 0,
        }));
      const [p, f] = await Promise.all([
        scheduleApi.simulate({ algorithm: 'priority', interviews: mk('priority') }),
        scheduleApi.simulate({ algorithm: 'fcfs', interviews: mk('fcfs') }),
      ]);
      setCompare([
        { id: 'priority', label: 'Priority (CGPA Descending)', avg: p.data.avg_waiting_time },
        { id: 'fcfs', label: 'FCFS (Application Order)', avg: f.data.avg_waiting_time },
      ]);
    } catch (err) {
      toast(errMsg(err, 'Algorithm simulation failed.'), 'error');
    } finally {
      setComparing(false);
    }
  };

  const executeClear = async () => {
    setClearing(true);
    try {
      await scheduleApi.clearAuto(driveId);
      setResult(null);
      setCompare(null);
      toast('Timetable cleared. Select parameters to regenerate.', 'success');
      setConfirmOpen(false);
    } catch (err) {
      toast(errMsg(err, 'Could not clear the timetable.'), 'error');
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <Skeleton className="h-64 w-full rounded-[10px]" />
      </div>
    );
  }

  const lab = result?.lab;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling Lab"
        subtitle="Algorithmic interview timetable engine comparing FCFS and Priority heuristics."
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'OS Lab' },
          { label: 'Scheduling Lab' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-5">
          <div className="border-b border-[var(--border-color)] pb-3">
            <h2 className="text-base font-serif font-bold text-[var(--text-primary)]">
              1. Drive Selection
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
              Only shortlisted candidates receive automated interview allocations.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1.5">
              Select Placement Drive
            </label>
            <select
              value={driveId}
              onChange={(e) => setDriveId(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-accent)]"
            >
              {drives.map((d) => (
                <option
                  key={d.id}
                  value={d.id}
                  disabled={(d.counts?.shortlisted ?? 0) === 0}
                >
                  {d.title} ({d.counts?.shortlisted ?? 0} shortlisted)
                </option>
              ))}
            </select>
            {selected && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="info">{selected.status}</Badge>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {selected.company?.name}
                </span>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-base font-serif font-bold text-[var(--text-primary)] mb-1.5">
              2. Scheduling Algorithm
            </h2>
            <div className="space-y-2.5">
              {ALGOS.map((a) => {
                const isSelected = algo === a.id;
                return (
                  <label
                    key={a.id}
                    className={`block p-3.5 rounded-[6px] border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#D9B36C] bg-[#D9B36C]/10 text-[var(--text-primary)] font-semibold'
                        : 'border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:border-[var(--brand-accent)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="algo"
                        checked={isSelected}
                        onChange={() => setAlgo(a.id)}
                        className="accent-[#0F7B5F] dark:accent-[#D9B36C]"
                      />
                      <span className="text-xs font-mono uppercase tracking-wide">
                        {a.label}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-sans mt-1.5 ml-6">
                      {a.desc}
                    </p>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Slot Length (Min)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono"
              />
            </div>
          </div>

          <Button
            variant="primary"
            className="w-full"
            onClick={generate}
            disabled={running || !driveId}
            loading={running}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Generate Interview Timetable
          </Button>

          <p className="text-[11px] font-mono text-[var(--text-muted)]">
            Executes Banker's safety check on physical interview room inventory before slot generation.
          </p>
        </div>

        {/* Results & Simulation Panel */}
        <div className="lg:col-span-3 space-y-5">
          {/* Lab Booking Banner */}
          {lab && (
            <div
              className={`p-4 rounded-[6px] border text-xs font-mono flex items-start gap-3 ${
                lab.status === 'reserved'
                  ? 'border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                  : 'border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]'
              }`}
            >
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block mb-0.5">
                  {lab.status === 'reserved' ? `✓ ${lab.resource_name} Reserved` : 'Lab Booking Refused'}
                </span>
                {lab.status === 'reserved'
                  ? `${lab.seats} seats secured for the duration of this interview cycle.`
                  : lab.explanation}
              </div>
            </div>
          )}

          {!result ? (
            <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-12 text-center space-y-3 shadow-subtle">
              <Calendar className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-40" />
              <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                Timetable Engine Idle
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-mono max-w-sm mx-auto">
                Pick a drive and generate to trigger candidate slot allocations, room reservations, and algorithmic benchmarks.
              </p>
            </div>
          ) : result.already ? (
            <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                  Existing Timetable Loaded
                </h3>
                <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
                  Clear & Re-generate
                </Button>
              </div>
              <p className="text-xs font-mono text-[var(--text-secondary)]">
                {result.existing?.length ?? 0} slots are already scheduled for this drive in the database.
              </p>
            </div>
          ) : (
            <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div>
                  <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                    Generated Timetable
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                    {result.timeline?.length ?? 0} Candidate Slots Built across {result.panels ?? 1} Panel(s)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={compareAlgos}
                    loading={comparing}
                    icon={<BarChart2 className="w-4 h-4" />}
                  >
                    Compare FCFS vs Priority
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
                    Clear
                  </Button>
                </div>
              </div>

              {/* Algorithm Comparison Benchmarks */}
              {compare && (
                <div className="p-4 rounded-[6px] border border-[var(--border-gold)] bg-[var(--bg-subtle)] space-y-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] block">
                    OS Scheduling Benchmark (Turnaround / Wait)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    {compare.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-[4px] border ${
                          c.id === algo
                            ? 'border-[#D9B36C] bg-[var(--brand-accent)]/15 text-[var(--text-primary)] font-bold'
                            : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <div className="text-[11px] uppercase opacity-75">{c.label}</div>
                        <div className="text-lg mt-1 font-bold">
                          {c.avg.toFixed(1)} <span className="text-xs font-normal">min avg wait</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Slot List */}
              <div className="space-y-2 max-h-96 overflow-y-auto slim-scroll pr-1">
                {result.timeline?.map((slot, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-[4px] bg-[#D9B36C] text-[#0B1F1A] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-serif font-bold text-sm text-[var(--text-primary)]">
                          {slot.student_name}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          Panel {slot.panel} · {slot.venue || 'Lab TBA'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[var(--text-secondary)] font-bold">
                      {formatDate(slot.starts_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executeClear}
        title="Clear Timetable?"
        message="This will remove the generated interview slots for this drive so you can build them with new parameters."
        confirmLabel="Yes, Clear Slots"
        variant="danger"
        loading={clearing}
      />
    </div>
  );
}
