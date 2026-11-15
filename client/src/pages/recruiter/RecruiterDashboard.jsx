// Recruiter Overview — Hiring funnel, key KPIs, and "Needs your action" queue.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { drives as drivesApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Button from '../../components/Button.jsx';
import Badge from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import NeedsAttention from '../../components/NeedsAttention.jsx';
import { PlusCircle, Briefcase, Users, FileCheck, CheckCircle2, ArrowRight } from 'lucide-react';

const STAGE_META = {
  open: { label: 'Applications Open', variant: 'success', hint: 'Accepting applications from eligible students.' },
  testing: { label: 'Test Scheduled', variant: 'info', hint: 'Students are actively taking aptitude tests.' },
  interviews: { label: 'Interviews Scheduled', variant: 'warning', hint: 'Interview panels are currently active.' },
  closed: { label: 'Closed', variant: 'neutral', hint: 'This placement cycle is concluded.' },
  draft: { label: 'Draft', variant: 'neutral', hint: 'Pending configuration and publication.' },
};

export default function RecruiterDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);

  useEffect(() => {
    drivesApi
      .list()
      .then(({ data }) => setDrives(data ?? []))
      .catch((err) => toast(errMsg(err, 'Could not load your drives.'), 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

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

  const active = drives.filter((d) => d.status !== 'closed');
  const totalApplied = drives.reduce((acc, d) => acc + (d.counts?.applied ?? 0), 0);
  const totalShortlisted = drives.reduce((acc, d) => acc + (d.counts?.shortlisted ?? 0), 0);

  // Derive "Needs your action" items
  const attentionItems = [];
  drives.forEach((d) => {
    if (d.status === 'open' && (d.counts?.applied ?? 0) > 0) {
      attentionItems.push({
        title: `${d.title} is ready for test scheduling`,
        detail: `${d.counts?.applied} applicant(s) waiting. Schedule test sessions when application window closes.`,
        actionLabel: 'Schedule',
        onClick: () => navigate(`/recruiter/drives/${d.id}`),
      });
    } else if (d.status === 'testing') {
      attentionItems.push({
        title: `${d.title} has tests in progress`,
        detail: 'Review live submissions and publish cutoff results.',
        actionLabel: 'Review',
        onClick: () => navigate(`/recruiter/drives/${d.id}`),
      });
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment Overview"
        subtitle="Manage your placement pipelines, candidate evaluations, and automated schedules."
        breadcrumbs={[{ label: 'Recruiter' }, { label: 'Overview' }]}
        actions={
          <Link to="/recruiter/drives/new">
            <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
              Create Drive
            </Button>
          </Link>
        }
      />

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Drives" value={active.length} icon={<Briefcase className="w-5 h-5" />} />
        <StatCard label="Total Applicants" value={totalApplied} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Shortlisted" value={totalShortlisted} icon={<FileCheck className="w-5 h-5" />} />
        <StatCard label="Completed" value={drives.length - active.length} icon={<CheckCircle2 className="w-5 h-5" />} />
      </div>

      {/* Needs Attention Queue */}
      {attentionItems.length > 0 && (
        <NeedsAttention
          title="Requires Your Attention"
          items={attentionItems}
        />
      )}

      {/* Active Drives Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold text-[var(--text-primary)]">
            Active Placement Drives
          </h2>
          <Link to="/recruiter/drives" className="text-xs font-mono text-[#0F7B5F] dark:text-[#D9B36C] hover:underline flex items-center gap-1">
            <span>View All Drives</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {active.length === 0 ? (
          <EmptyState
            title="No active drives"
            message="Your placement pipeline is clear. Create a drive to invite student applications."
            action={
              <Link to="/recruiter/drives/new">
                <Button variant="primary">Add your first drive</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((drive) => {
              const meta = STAGE_META[drive.status] ?? STAGE_META.open;
              return (
                <div
                  key={drive.id}
                  onClick={() => navigate(`/recruiter/drives/${drive.id}`)}
                  className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5 shadow-subtle hover:border-[var(--brand-accent)]/50 transition-colors cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-[var(--text-muted)] font-mono">{drive.company?.name}</div>
                        <h3 className="font-serif font-bold text-lg text-[var(--text-primary)] leading-snug truncate mt-0.5">
                          {drive.title}
                        </h3>
                      </div>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2 font-sans line-clamp-2">{meta.hint}</p>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[var(--border-color)] text-xs font-mono">
                      <div>
                        <span className="text-[var(--text-muted)]">Applied:</span>{' '}
                        <span className="font-bold text-[var(--text-primary)]">{drive.counts?.applied ?? 0}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Shortlisted:</span>{' '}
                        <span className="font-bold text-[var(--text-primary)]">{drive.counts?.shortlisted ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-muted)]">Deadline: {formatDate(drive.application_deadline).split(',')[0]}</span>
                    <span className="text-[#0F7B5F] dark:text-[#D9B36C] font-semibold">Workspace →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
