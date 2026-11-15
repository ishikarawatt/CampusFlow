// Admin Resources — Physical inventory (Labs & Interview Rooms).
// Automated scheduling operates on this capacity; manual board executes Banker's safety check.

import React, { useEffect, useState } from 'react';
import { resources as resourcesApi, allocations as allocationsApi, errMsg } from '../../api.js';
import { formatDate, titleCase } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import { LedgerStrip, LedgerTable, StampBadge, MarginNote } from '../../components/signature';
import Skeleton from '../../components/Skeleton.jsx';
import { Boxes, Building2, ShieldCheck, PlusCircle, AlertCircle } from 'lucide-react';

const TYPE_BADGE = { lab: 'info', room: 'success', interviewer: 'warning' };

export default function Resources() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [allocs, setAllocs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'lab', capacity: '40', location: '' });
  const [allocForm, setAllocForm] = useState({
    resource_id: '',
    purpose: '',
    seats_needed: '10',
    starts_at: '',
    ends_at: '',
  });

  const load = async () => {
    try {
      const [{ data: r }, { data: a }] = await Promise.all([
        resourcesApi.list(),
        allocationsApi.list(),
      ]);
      setResources(r ?? []);
      setAllocs(a ?? []);
      if ((r ?? []).length && !allocForm.resource_id) {
        setAllocForm((f) => ({ ...f, resource_id: String(r[0].id) }));
      }
    } catch (err) {
      toast(errMsg(err, 'Could not load resources.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addResource = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Give the resource a name.', 'error');
      return;
    }
    setSaving(true);
    try {
      await resourcesApi.create({
        name: form.name.trim(),
        type: form.type,
        capacity: Math.max(1, Number(form.capacity) || 1),
        location: form.location.trim() || null,
      });
      toast(`${form.name.trim()} added to resource pool.`, 'success');
      setForm({ name: '', type: 'lab', capacity: '40', location: '' });
      setShowAdd(false);
      load();
    } catch (err) {
      toast(errMsg(err, 'Could not add the resource.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const allocate = async (e) => {
    e.preventDefault();
    if (!allocForm.purpose.trim() || !allocForm.starts_at || !allocForm.ends_at) {
      toast('Fill in purpose, start and end time.', 'error');
      return;
    }
    setAllocating(true);
    setVerdict(null);
    try {
      await allocationsApi.create({
        resource_id: Number(allocForm.resource_id),
        purpose: allocForm.purpose.trim(),
        starts_at: allocForm.starts_at,
        ends_at: allocForm.ends_at,
      });
      setVerdict({ ok: true, message: "Resource booked — Banker's safety check passed." });
      setAllocForm((f) => ({ ...f, purpose: '', starts_at: '', ends_at: '' }));
      load();
    } catch (err) {
      if (err?.response?.status === 409) {
        const explanation = err?.response?.data?.explanation || err?.response?.data?.error;
        setVerdict({
          ok: false,
          message: 'Booking refused: Unsafe state (Banker Algorithm).',
          explanation,
        });
      } else {
        toast(errMsg(err, 'Could not book the resource.'), 'error');
      }
    } finally {
      setAllocating(false);
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

  const grouped = resources.reduce((m, r) => {
    const t = r.type ?? 'other';
    (m[t] = m[t] || []).push(r);
    return m;
  }, {});
  const labSeats = (grouped.lab ?? []).reduce((s, r) => s + Number(r.capacity || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources & Labs"
        subtitle="Physical capacity inventory powering the automated test and interview timetable engines."
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Resources' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAdd((v) => !v)}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            Add Resource
          </Button>
        }
      />

      {/* KPI Ribbon */}
      <LedgerStrip
        items={[
          { label: 'Computer labs', value: grouped.lab?.length ?? 0 },
          { label: 'Total test seats', value: labSeats, unit: 'seats' },
          { label: 'Interview rooms', value: grouped.room?.length ?? 0 },
        ]}
      />

      {/* New Resource Form Modal / Inline */}
      {showAdd && (
        <form
          onSubmit={addResource}
          className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-gold)] p-6 shadow-subtle space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
              Register New Campus Resource
            </h3>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                Resource Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Turing Lab C"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-2 text-sm text-[var(--text-primary)] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-2 text-sm text-[var(--text-primary)] font-mono"
              >
                <option value="lab">Computer Lab</option>
                <option value="room">Interview Room</option>
                <option value="interviewer">Panel Interviewer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                Seat Capacity
              </label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-2 text-sm text-[var(--text-primary)] font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" type="submit" loading={saving}>
              Save Resource
            </Button>
          </div>
        </form>
      )}

      {/* Resource Inventory List */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)]">
          <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
            Active Inventory Pool
          </h3>
        </div>
        <LedgerTable
          columns={[
            {
              header: 'Resource Name',
              label: 'Resource Name',
              render: (r) => (
                <span className="font-serif font-bold text-sm text-[var(--text-primary)]">
                  {r.name}
                </span>
              ),
            },
            {
              key: 'type',
              label: 'Classification',
              render: (r) => (
                <StampBadge size="sm" variant={TYPE_BADGE[r.type] ?? 'neutral'}>{titleCase(r.type)}</StampBadge>


              ),
            },
            {
              key: 'capacity',
              label: 'Workstation Capacity',
              render: (r) => (
                <span className="font-mono font-bold text-xs text-[var(--text-primary)]">
                  {r.capacity} Seats
                </span>
              ),
            },
            {
              key: 'location',
              label: 'Building Location',
              render: (r) => (
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {r.location || 'Main Campus'}
                </span>
              ),
            },
          ]}
          data={resources}
        />
      </div>

      {/* Manual Allocation Board (Banker Algorithm) */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-4">
        <div className="border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0F7B5F] dark:text-[#D9B36C]" />
            <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
              Manual Booking & Deadlock Avoidance Board
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            Reservations are evaluated using Dijkstra's Banker Algorithm to prevent deadlocks and oversubscription.
          </p>
        </div>

        {verdict && (
          <div
            className={`p-4 rounded-[6px] border text-xs font-mono ${
              verdict.ok
                ? 'border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                : 'border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]'
            }`}
          >
            <span className="font-bold block mb-0.5">{verdict.message}</span>
            {verdict.explanation && <p className="mt-1 opacity-90">{verdict.explanation}</p>}
          </div>
        )}

        <form onSubmit={allocate} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
              Resource
            </label>
            <select
              value={allocForm.resource_id}
              onChange={(e) => setAllocForm({ ...allocForm, resource_id: e.target.value })}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono"
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.capacity} seats)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
              Purpose / Drive
            </label>
            <input
              value={allocForm.purpose}
              onChange={(e) => setAllocForm({ ...allocForm, purpose: e.target.value })}
              placeholder="e.g. Aptitude Test Batch 1"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={allocForm.starts_at}
              onChange={(e) => setAllocForm({ ...allocForm, starts_at: e.target.value })}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
              End Time
            </label>
            <input
              type="datetime-local"
              value={allocForm.ends_at}
              onChange={(e) => setAllocForm({ ...allocForm, ends_at: e.target.value })}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono"
            />
          </div>

          <div className="sm:col-span-4 flex justify-end">
            <Button variant="primary" size="sm" type="submit" loading={allocating}>
              Verify & Allocate
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
