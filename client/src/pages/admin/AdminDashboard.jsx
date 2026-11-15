// Admin Command Center — The Master Institutional Placement Registry
// Asymmetric layout:
// Left: LedgerStrip, Needs-Attention Action Docket, Master Pipeline LedgerTable
// Right: TimelineRule for today's schedule timetable, Controller of Examinations MarginNote.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { admin as adminApi, drives as drivesApi, examMonitoring as examApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import {
  LedgerStrip,
  Docket,
  MarginNote,
  StampBadge,
  TimelineRule,
  LedgerTable,
} from '../../components/signature';
import { MonitorCheck, Shield, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

const STAGE_META = {
  open: { label: 'APPLICATIONS', variant: 'success' },
  testing: { label: 'ASSESSMENT', variant: 'info' },
  interviews: { label: 'INTERVIEWS', variant: 'warning' },
  closed: { label: 'CONCLUDED', variant: 'neutral' },
  draft: { label: 'DRAFT', variant: 'neutral' },
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
      toast(errMsg(err, 'Could not load Command Center telemetry.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (drive, action) => {
    setBusy(`${drive.id}-${action}`);
    try {
      if (action === 'schedule_tests') {
        const { data } = await drivesApi.scheduleTests(drive.id);
        toast(`Scheduled ${data.scheduled} student test slots across computer labs.`, 'success');
      } else if (action === 'publish_results') {
        const { data } = await drivesApi.publishResults(drive.id);
        toast(`Shortlisted ${data.shortlisted}, built ${data.interviews} interview slots.`, 'success');
      }
      load();
    } catch (err) {
      toast(errMsg(err, 'Pipeline action failed.'), 'danger');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-[6px]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 rounded-[6px]" />
            <Skeleton className="h-64 rounded-[6px]" />
          </div>
          <Skeleton className="h-96 rounded-[6px]" />
        </div>
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

  // Compute "Needs Attention" items for Docket
  const docketItems = [];
  drives.forEach((d) => {
    if (d.next_action === 'schedule_tests') {
      docketItems.push({
        id: `sched-${d.id}`,
        type: 'LAB ALLOCATION',
        typeVariant: 'warning',
        title: `${d.title} — ${d.applied} Applications Received`,
        description: 'Application deadline passed. Trigger automated lab partitioning & terminal seat map.',
        action: (
          <Button
            variant="primary"
            size="sm"
            loading={busy === `${d.id}-schedule_tests`}
            onClick={() => runAction(d, 'schedule_tests')}
          >
            Partition Labs
          </Button>
        ),
      });
    } else if (d.next_action === 'publish_results') {
      docketItems.push({
        id: `pub-${d.id}`,
        type: 'PUBLISH SCORES',
        typeVariant: 'info',
        title: `${d.title} — ${d.tests_taken} Tests Concluded`,
        description: 'Aptitude tests completed. Calculate cutoff and generate interview panel tracks.',
        action: (
          <Button
            variant="primary"
            size="sm"
            loading={busy === `${d.id}-publish_results`}
            onClick={() => runAction(d, 'publish_results')}
          >
            Publish Cutoffs
          </Button>
        ),
      });
    }
  });

  const offlinePCs = pcs.filter((p) => p.status === 'offline');
  if (offlinePCs.length > 0) {
    docketItems.push({
      id: 'offline-pcs',
      type: 'SUPERVISOR ALERT',
      typeVariant: 'danger',
      title: `${offlinePCs.length} Exam Workstations Unreachable`,
      description: 'Terminals in active exam labs are not sending heartbeat signals to the proctor daemon.',
      action: (
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/exam-pcs')}>
          Inspect Floor Plan
        </Button>
      ),
    });
  }

  // Map today's schedule into TimelineRule gantt segments
  const ganttSchedule = schedule.slice(0, 8).map((s, idx) => {
    const startDate = new Date(s.starts_at);
    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    const duration = s.type === 'test' ? 1.5 : 0.75;
    return {
      id: s.id || idx,
      label: `${s.title} (${s.type?.toUpperCase() || 'EXAM'})`,
      start: Math.max(8, startHour),
      end: Math.max(8, startHour) + duration,
    };
  });

  const driveColumns = [
    {
      header: 'PLACEMENT DRIVE',
      accessor: 'title',
      render: (d) => (
        <div>
          <span className="font-serif font-bold text-sm text-midnight dark:text-ivory block">
            {d.title}
          </span>
          <span className="text-[11px] font-mono text-midnight/60 dark:text-brandMuted">
            {d.company} • ₹{d.package_lpa || '—'} LPA
          </span>
        </div>
      ),
    },
    {
      header: 'STAGE',
      accessor: 'stage',
      render: (d) => (
        <StampBadge variant={STAGE_META[d.stage]?.variant || 'neutral'} size="sm">
          {STAGE_META[d.stage]?.label || d.stage}
        </StampBadge>
      ),
    },
    {
      header: 'APPLIED',
      accessor: 'applied',
      align: 'right',
      mono: true,
      render: (d) => <span className="tabular-nums font-bold">{d.applied}</span>,
    },
    {
      header: 'TESTS',
      accessor: 'tests_taken',
      align: 'right',
      mono: true,
      render: (d) => <span className="tabular-nums">{d.tests_taken}</span>,
    },
    {
      header: 'SHORTLISTED',
      accessor: 'shortlisted',
      align: 'right',
      mono: true,
      render: (d) => (
        <span className="tabular-nums font-bold text-emerald dark:text-emerald-light">
          {d.shortlisted}
        </span>
      ),
    },
    {
      header: 'NEXT ACTION',
      render: (d) =>
        d.next_action ? (
          <Button
            variant="outline"
            size="sm"
            loading={busy === `${d.id}-${d.next_action}`}
            onClick={() => runAction(d, d.next_action)}
            className="text-[11px] font-mono"
          >
            {NEXT_ACTION_LABEL[d.next_action]}
          </Button>
        ) : (
          <span className="text-[11px] font-mono text-midnight/40 dark:text-brandMuted">
            Synchronized
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Command Center"
        subtitle="Institutional operations desk: live recruitment pipeline supervision, resource dispatching, and exam workstation health."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Command Center' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/monitoring">
              <Button variant="primary" size="sm" icon={<MonitorCheck className="w-4 h-4" />}>
                Exam Supervision Floor
              </Button>
            </Link>
          </div>
        }
      />

      {/* 1. Archival Ledger Strip (Replacing Generic Icon-in-Square Cards) */}
      <LedgerStrip
        items={[
          {
            label: 'RECORDED APPLICANTS',
            value: totals.applied,
            unit: 'Submissions',
            subtext: `${drives.length} Approved Drives`,
          },
          {
            label: 'ASSESSMENTS CONDUCTED',
            value: totals.tests_taken,
            unit: 'Evaluated',
            subtext: 'Auto-graded by kernel',
          },
          {
            label: 'SHORTLISTED CANDIDATES',
            value: totals.shortlisted,
            unit: 'Qualified',
            trend: totals.shortlisted > 0 ? 'up' : null,
            subtext: 'Above institutional cutoff',
          },
          {
            label: 'INTERVIEW SLOTS',
            value: totals.interviews,
            unit: 'Scheduled',
            subtext: 'Across department panels',
          },
        ]}
      />

      {/* 2. Asymmetric Central Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Action Docket + Active Pipelines LedgerTable */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Docket for Admin */}
          {docketItems.length > 0 && (
            <Docket
              title="SUPERVISION ACTION DOCKET"
              subTitle="Urgent operational checkpoints requiring administrator trigger"
              items={docketItems}
            />
          )}

          {/* Master Placement Pipeline LedgerTable */}
          <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E0D0] dark:border-midnight-border">
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-midnight/50 dark:text-brandMuted">
                  OFFICIAL INSTITUTIONAL PIPELINE
                </span>
                <h3 className="text-sm font-serif font-bold text-midnight dark:text-ivory">
                  Placement Drive Master Ledger
                </h3>
              </div>
              <span className="text-xs font-mono text-midnight/60 dark:text-brandMuted">
                {drives.length} Active Records
              </span>
            </div>

            <LedgerTable
              columns={driveColumns}
              data={drives}
              keyField="id"
              emptyMessage="No placement drives registered in the institutional ledger."
            />
          </div>
        </div>

        {/* Right Column: TimelineRule Schedule + Controller Directive MarginNote */}
        <div className="space-y-6">
          {/* Daily Schedule Timetable on TimelineRule */}
          <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E0D0] dark:border-midnight-border">
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-midnight/50 dark:text-brandMuted">
                  TIMETABLE DISPATCH
                </span>
                <h3 className="text-sm font-serif font-bold text-midnight dark:text-ivory">
                  Today's Session Ruler
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald dark:text-emerald-light font-bold">
                HOURS 08:00–20:00
              </span>
            </div>

            {ganttSchedule.length > 0 ? (
              <TimelineRule
                gantt={ganttSchedule}
                ticks={6}
                unitLabel="hrs"
              />
            ) : (
              <div className="p-6 text-center text-xs font-mono text-midnight/50 dark:text-brandMuted border border-dashed border-[#D9CEBA] dark:border-midnight-border rounded">
                No session blocks scheduled for current date.
              </div>
            )}
          </div>

          {/* Controller of Examinations Regulatory Note */}
          <MarginNote title="CONTROLLER OF EXAMINATIONS DIRECTIVE" variant="gold">
            <p>
              <strong>Terminal Security Protocol:</strong> Workstations operating in Lab 1 and Lab 2 enforce the CampusFlow background daemon. Heartbeat telemetry failure exceeding 60 seconds triggers proctor alert.
            </p>
            <p className="mt-2">
              <strong>Single Offer Lock:</strong> Once an offer acceptance transaction commits to the database, candidate withdrawal triggers are executed synchronously.
            </p>
          </MarginNote>

          {/* Quick Admin Supervision Shortcuts */}
          <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-midnight/50 dark:text-brandMuted block mb-2 font-bold">
              SUPERVISION SUITE
            </span>
            <div className="space-y-2 text-xs">
              <Link
                to="/admin/monitoring"
                className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7F0] dark:hover:bg-midnight border border-[#E2D9C8] dark:border-midnight-border font-mono text-midnight dark:text-ivory"
              >
                <span>Exam Supervision Live Floor</span>
                <span>→</span>
              </Link>
              <Link
                to="/admin/exam-pcs"
                className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7F0] dark:hover:bg-midnight border border-[#E2D9C8] dark:border-midnight-border font-mono text-midnight dark:text-ivory"
              >
                <span>Lab Terminals & Workstations</span>
                <span>→</span>
              </Link>
              <Link
                to="/admin/kernel"
                className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7F0] dark:hover:bg-midnight border border-[#E2D9C8] dark:border-midnight-border font-mono text-midnight dark:text-ivory"
              >
                <span>OS Kernel Monitor & Stress Test</span>
                <span>→</span>
              </Link>
              <Link
                to="/admin/scheduling-lab"
                className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7F0] dark:hover:bg-midnight border border-[#E2D9C8] dark:border-midnight-border font-mono text-midnight dark:text-ivory"
              >
                <span>Algorithm Scheduling Lab</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
