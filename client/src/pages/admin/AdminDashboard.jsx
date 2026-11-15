// Admin Command Center — The entire placement operation at a glance.
// Stat strip, Needs Attention queue, drive pipeline management, and master schedule timetable.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { admin as adminApi, drives as drivesApi, examMonitoring as examApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Badge from '../../components/Badge.jsx';
import DataTable from '../../components/DataTable.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import Button from '../../components/Button.jsx';
import NeedsAttention from '../../components/NeedsAttention.jsx';
import { Shield, FileText, CheckCircle2, Calendar, MonitorCheck, ArrowRight, Cpu } from 'lucide-react';

const STAGE_META = {
  open: { label: 'Applications', variant: 'success' },
  testing: { label: 'Testing', variant: 'info' },
  interviews: { label: 'Interviews', variant: 'warning' },
  closed: { label: 'Closed', variant: 'neutral' },
  draft: { label: 'Draft', variant: 'neutral' },
};

const NEXT_ACTION_LABEL = {
  schedule_tests: 'Schedule Tests',
  publish_results: 'Publish Results',
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [pcs, setPcs] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    try {
      const [{ data: o }, { data: s }, { data: pcList }] = await Promise.all([
        adminApi.overview(),
        adminApi.schedule(),
        examApi.pcs().catch(() => ({ data: [] })),
      ]);
      setDrives(o ?? []);
      setSchedule(s ?? []);
      setPcs(pcList ?? []);
    } catch (err) {
      toast(errMsg(err, 'Could not load Command Center telemetry.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (drive, action) => {
    setBusy(`${action}:${drive.id}`);
    try {
      if (action === 'schedule_tests') {
        const { data } = await drivesApi.scheduleTests(drive.id);
        toast(`Scheduled ${data.sessions} session${data.sessions !== 1 ? 's' : ''} for ${data.assigned} students.`, 'success');
      } else {
        const { data } = await drivesApi.publishResults(drive.id);
        toast(`Shortlisted ${data.shortlisted}, built ${data.interviews} interview slots.`, 'success');
      }
      load();
    } catch (err) {
      toast(errMsg(err, 'Action failed.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-[10px]" />
          <Skeleton className="h-24 rounded-[10px]" />
          <Skeleton className="h-24 rounded-[10px]" />
          <Skeleton className="h-24 rounded-[10px]" />
        </div>
        <Skeleton className="h-64 rounded-[10px]" />
      </div>
    );
  }

  const totals = drives.reduce(
    (m, d) => ({
      applied: m.applied + d.applied,
      tests_taken: m.tests_taken + d.tests_taken,
      shortlisted: m.shortlisted + d.shortlisted,
      interviews: m.interviews + d.interview_slots,
    }),
    { applied: 0, tests_taken: 0, shortlisted: 0, interviews: 0 }
  );

  // Compute "Needs Attention" items:
  // 1. Drives ready for action
  // 2. Offline or suspicious exam PCs
  const attentionItems = [];
  drives.forEach((d) => {
    if (d.next_action === 'schedule_tests') {
      attentionItems.push({
        title: `${d.title} is ready for test allocation`,
        detail: `${d.applied} student applications received. Allocate computer lab sessions.`,
        actionLabel: 'Schedule',
        onClick: () => runAction(d, 'schedule_tests'),
      });
    } else if (d.next_action === 'publish_results') {
      attentionItems.push({
        title: `${d.title} tests concluded`,
        detail: `${d.tests_taken} test submissions ready for score cutoffs and interview slotting.`,
        actionLabel: 'Publish',
        onClick: () => runAction(d, 'publish_results'),
      });
    }
  });

  const offlinePCs = pcs.filter((p) => p.status === 'offline');
  if (offlinePCs.length > 0) {
    attentionItems.push({
      title: `${offlinePCs.length} Exam PC(s) currently offline`,
      detail: 'Workstations in active test labs are unreachable by the supervision daemon.',
      actionLabel: 'Inspect PCs',
      onClick: () => navigate('/admin/exam-pcs'),
    });
  }

  const upcomingSessions = schedule
    .filter((s) => new Date(s.starts_at).getTime() >= Date.now())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Command Center"
        subtitle="Live placement pipeline supervision, resource dispatching, and exam workstation health."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Command Center' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/monitoring">
              <Button variant="secondary" size="sm" icon={<MonitorCheck className="w-4 h-4" />}>
                Exam Supervision
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Applications" value={totals.applied} icon={<FileText className="w-5 h-5" />} />
        <StatCard label="Tests Taken" value={totals.tests_taken} icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatCard label="Shortlisted" value={totals.shortlisted} icon={<Shield className="w-5 h-5" />} />
        <StatCard label="Interview Slots" value={totals.interviews} icon={<Calendar className="w-5 h-5" />} />
      </div>

      {/* Needs Attention Queue */}
      {attentionItems.length > 0 && (
        <NeedsAttention
          title="Supervision Action Queue"
          items={attentionItems}
        />
      )}

      {/* All Drives Pipeline Table */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
              Placement Pipelines
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
              Active student progressions across participating companies
            </p>
          </div>
          <Link
            to="/admin/resources"
            className="text-xs font-mono text-[#0F7B5F] dark:text-[#D9B36C] hover:underline"
          >
            Manage Labs →
          </Link>
        </div>

        {drives.length === 0 ? (
          <EmptyState
            title="No placement drives active"
            message="Published drives from recruiters will appear here automatically."
          />
        ) : (
          <DataTable
            columns={[
              {
                key: 'drive',
                label: 'Drive & Partner',
                render: (d) => (
                  <div>
                    <span className="font-serif font-bold text-sm text-[var(--text-primary)]">
                      {d.title}
                    </span>
                    <span className="block text-xs font-mono text-[var(--text-muted)]">
                      {d.company}
                    </span>
                  </div>
                ),
              },
              {
                key: 'stage',
                label: 'Stage',
                render: (d) => (
                  <Badge variant={STAGE_META[d.stage]?.variant ?? 'neutral'}>
                    {STAGE_META[d.stage]?.label ?? d.stage}
                  </Badge>
                ),
              },
              {
                key: 'progress',
                label: 'Funnel Progress',
                render: (d) => (
                  <span className="font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">
                    <b className="text-[var(--text-primary)]">{d.applied}</b> applied →{' '}
                    <b className="text-[var(--text-primary)]">{d.tests_taken}</b> tested →{' '}
                    <b className="text-[var(--text-primary)]">{d.shortlisted}</b> shortlisted
                  </span>
                ),
              },
              {
                key: 'sessions',
                label: 'Allocations',
                render: (d) => (
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {d.test_sessions} Tests · {d.interview_slots} Interviews
                  </span>
                ),
              },
              {
                key: 'action',
                label: 'Next Action',
                render: (d) =>
                  d.next_action ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => runAction(d, d.next_action)}
                      loading={busy === `${d.next_action}:${d.id}`}
                    >
                      {NEXT_ACTION_LABEL[d.next_action] ?? d.next_action}
                    </Button>
                  ) : (
                    <span className="text-xs font-mono text-[var(--text-muted)]">—</span>
                  ),
              },
            ]}
            rows={drives}
          />
        )}
      </div>

      {/* Master Timetable */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
              Master Session Timetable
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
              Scheduled laboratory examinations and interview slots across all drives
            </p>
          </div>
          <Link
            to="/admin/scheduling"
            className="text-xs font-mono text-[#0F7B5F] dark:text-[#D9B36C] hover:underline"
          >
            Scheduling Lab →
          </Link>
        </div>

        {upcomingSessions.length === 0 ? (
          <p className="text-xs font-mono text-[var(--text-muted)] py-4 text-center">
            No upcoming sessions scheduled in the active queue.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingSessions.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center gap-3.5"
              >
                <div
                  className={`w-9 h-9 rounded-[4px] flex items-center justify-center text-sm shrink-0 ${
                    s.type === 'test'
                      ? 'bg-[var(--status-info-bg)] text-[var(--status-info-text)]'
                      : 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                  }`}
                >
                  {s.type === 'test' ? '📝' : '🎤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif font-bold text-sm text-[var(--text-primary)] truncate">
                    {s.title}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                    {s.drive_title} · {s.company_name}
                  </div>
                </div>
                <div className="text-right text-xs font-mono text-[var(--text-secondary)] shrink-0">
                  <div>{formatDate(s.starts_at).split(',')[0]}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {s.venue ?? 'Lab TBA'} · {s.booked_count}/{s.capacity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
