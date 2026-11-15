// Recruiter Overview — Campus Placement Operations Deck
// Asymmetric layout:
// Left: LedgerStrip, Hiring Funnel Ledger Bar, Action Docket
// Right: MarginNote column with "Next Best Action" plain guidance.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { drives as drivesApi, recruiter as recruiterApi, errMsg } from '../../api.js';
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
} from '../../components/signature';
import { PlusCircle, ArrowRight, Briefcase, Users, FileCheck } from 'lucide-react';

const STAGE_META = {
  open: { label: 'APPLICATIONS OPEN', variant: 'success' },
  testing: { label: 'ASSESSMENT ACTIVE', variant: 'info' },
  interviews: { label: 'INTERVIEWS SCHEDULED', variant: 'warning' },
  closed: { label: 'CONCLUDED', variant: 'neutral' },
  draft: { label: 'DRAFT REGISTER', variant: 'neutral' },
};

export default function RecruiterDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    Promise.all([
      drivesApi.list().catch(() => ({ data: [] })),
      recruiterApi.getCompany().catch(() => ({ data: { company: null } })),
    ])
      .then(([{ data: dList }, compRes]) => {
        setDrives(dList ?? []);
        setCompany(compRes?.data?.company ?? null);
      })
      .catch((err) => toast(errMsg(err, 'Could not load recruiter operations deck.'), 'danger'))
      .finally(() => setLoading(false));
  }, [toast]);

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

  const active = drives.filter((d) => d.status !== 'closed');
  const totalApplied = drives.reduce((acc, d) => acc + (d.counts?.applied ?? 0), 0);
  const totalShortlisted = drives.reduce((acc, d) => acc + (d.counts?.shortlisted ?? 0), 0);
  const totalOffers = drives.reduce((acc, d) => acc + (d.counts?.offers ?? 0), 0);

  // Derive Docket "Needs Attention" items
  const docketItems = [];
  drives.forEach((d) => {
    if (d.status === 'open' && (d.counts?.applied ?? 0) > 0) {
      docketItems.push({
        id: `schedule-${d.id}`,
        type: 'SCHEDULE EXAM',
        typeVariant: 'warning',
        title: `${d.title} — ${d.counts?.applied} Applicant(s) Awaiting Assessment`,
        description: 'Application window has received submissions. Lock exam slots and configure question blueprints.',
        action: (
          <Button variant="primary" size="sm" onClick={() => navigate(`/recruiter/drives/${d.id}`)}>
            Configure Slot
          </Button>
        ),
      });
    } else if (d.status === 'testing') {
      docketItems.push({
        id: `review-${d.id}`,
        type: 'EVALUATE CUTOFF',
        typeVariant: 'info',
        title: `${d.title} — Written Assessment Underway`,
        description: 'Review candidate answer papers and establish shortlist qualifying threshold.',
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate(`/recruiter/drives/${d.id}`)}>
            Review Scores
          </Button>
        ),
      });
    }
  });

  // Calculate Funnel Proportions
  const funnelMax = Math.max(totalApplied, 1);
  const funnelStages = [
    { label: 'APPLICANTS', count: totalApplied, pct: 100, color: 'bg-emerald-800' },
    {
      label: 'SHORTLISTED',
      count: totalShortlisted,
      pct: Math.round((totalShortlisted / funnelMax) * 100),
      color: 'bg-emerald-600',
    },
    {
      label: 'OFFERS EXTENDED',
      count: totalOffers,
      pct: Math.round((totalOffers / funnelMax) * 100),
      color: 'bg-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate Placement Desk"
        subtitle={`Recruitment management deck for ${company?.name || 'Corporate Partner'}. Authoritative candidate pipelines and evaluation tracks.`}
        breadcrumbs={[{ label: 'Recruiter' }, { label: 'Overview' }]}
        actions={
          <Link to="/recruiter/drives/new">
            <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
              Initiate New Drive
            </Button>
          </Link>
        }
      />

      {/* 1. Archival Ledger Strip */}
      <LedgerStrip
        items={[
          {
            label: 'ACTIVE PIPELINES',
            value: active.length,
            unit: 'Drives',
            subtext: `${drives.length - active.length} archived cycles`,
          },
          {
            label: 'TOTAL CANDIDATES',
            value: totalApplied,
            unit: 'Applicants',
            trend: totalApplied > 0 ? 'up' : null,
            subtext: 'Across all active drives',
          },
          {
            label: 'SHORTLISTED',
            value: totalShortlisted,
            unit: 'Qualified',
            subtext: 'Selected for interview rounds',
          },
          {
            label: 'OFFERS REGISTERED',
            value: totalOffers,
            unit: 'Extended',
            badge: totalOffers > 0 ? 'ACTIVE OFFERS' : undefined,
            subtext: 'Binding placement proposals',
          },
        ]}
      />

      {/* 2. Asymmetric Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Funnel Ledger + Docket + Active Drives */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ruled Hiring Funnel Ledger */}
          <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E0D0] dark:border-midnight-border">
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-midnight/50 dark:text-brandMuted">
                  INSTITUTIONAL PIPELINE CONVERSION
                </span>
                <h3 className="text-sm font-serif font-bold text-midnight dark:text-ivory">
                  Candidate Selection Ledger
                </h3>
              </div>
              <span className="text-[11px] font-mono text-midnight/60 dark:text-brandMuted">
                {totalApplied} Total Submissions
              </span>
            </div>

            {/* Proportional Bars */}
            <div className="space-y-3">
              {funnelStages.map((st, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-midnight/70 dark:text-brandMuted font-semibold">
                      {st.label}
                    </span>
                    <span className="font-bold text-midnight dark:text-ivory">
                      {st.count} Candidates ({st.pct}%)
                    </span>
                  </div>
                  <div className="h-4 bg-[#FAF7F0] dark:bg-midnight rounded-[2px] border border-[#E2D9C8] dark:border-midnight-border overflow-hidden">
                    <div
                      className={`h-full ${st.color} transition-all duration-500`}
                      style={{ width: `${Math.max(st.pct, 1)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Docket of pending items */}
          {docketItems.length > 0 && (
            <Docket
              title="RECRUITER ACTION DOCKET"
              subTitle="Decisions awaiting placement panel response"
              items={docketItems}
            />
          )}

          {/* Active Placement Drives Ledger List */}
          <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E0D0] dark:border-midnight-border">
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-midnight/50 dark:text-brandMuted">
                  ACTIVE RECRUITMENT CALENDAR
                </span>
                <h3 className="text-sm font-serif font-bold text-midnight dark:text-ivory">
                  Active Corporate Drives
                </h3>
              </div>
              <Link
                to="/recruiter/drives"
                className="text-xs font-mono text-emerald dark:text-emerald-light hover:underline flex items-center gap-1"
              >
                <span>Full Drives Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {active.length === 0 ? (
              <EmptyState
                title="No Active Placement Drives"
                message="All recruitment cycles concluded. Initiate a new campus placement drive to invite candidates."
                action={
                  <Link to="/recruiter/drives/new">
                    <Button variant="primary" size="sm">
                      Create Drive Blueprint
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-[#EFE9DC] dark:divide-midnight-border">
                {active.map((drive) => {
                  const meta = STAGE_META[drive.status] ?? STAGE_META.open;
                  return (
                    <div
                      key={drive.id}
                      onClick={() => navigate(`/recruiter/drives/${drive.id}`)}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF7F0] dark:hover:bg-midnight/50 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-serif font-bold text-midnight dark:text-ivory">
                            {drive.title}
                          </h4>
                          <StampBadge variant={meta.variant} size="sm">
                            {meta.label}
                          </StampBadge>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono text-midnight/60 dark:text-brandMuted mt-1">
                          <span>₹{drive.package_lpa || '—'} LPA</span>
                          <span>•</span>
                          <span>{drive.counts?.applied ?? 0} Applicants</span>
                          <span>•</span>
                          <span>{drive.counts?.shortlisted ?? 0} Shortlisted</span>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        Open Workspace
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: MarginNote "Next Best Step in Plain Words" */}
        <div className="space-y-6">
          <MarginNote title="NEXT BEST STEP IN PLAIN WORDS" variant="gold">
            {docketItems.length > 0 ? (
              <p>
                <strong>Immediate Action Recommended:</strong> Your active drive{' '}
                <span className="font-mono font-bold text-amber-800 dark:text-amber-300">
                  {docketItems[0].title.split('—')[0]}
                </span>{' '}
                has pending candidate milestones. Proceed to slot configuration to ensure lab terminals and proctors are allocated on time.
              </p>
            ) : active.length > 0 ? (
              <p>
                <strong>Pipeline In Order:</strong> All current candidate batches are synchronized. Monitor student assessment submissions or extend job offers to shortlisted candidates in the drive workspace.
              </p>
            ) : (
              <p>
                <strong>No Active Drives:</strong> Begin your recruiting season by configuring an Approved Drive with eligibility thresholds (CGPA, allowed departments, test durations).
              </p>
            )}
            <div className="mt-3 pt-2 border-t border-amber-600/20 text-[11px] font-mono text-midnight/70 dark:text-brandMuted">
              PLACEMENT CELL OPERATING CODE: CF-REC-2026
            </div>
          </MarginNote>

          {/* Quick Workspace Shortcuts */}
          <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-midnight/50 dark:text-brandMuted block mb-2 font-bold">
              OPERATIONAL SHORTCUTS
            </span>
            <div className="space-y-2 text-xs">
              <Link
                to="/recruiter/drives/new"
                className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7F0] dark:hover:bg-midnight border border-[#E2D9C8] dark:border-midnight-border font-mono text-midnight dark:text-ivory"
              >
                <span>+ Launch New Drive</span>
                <span>→</span>
              </Link>
              <Link
                to="/recruiter/company"
                className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7F0] dark:hover:bg-midnight border border-[#E2D9C8] dark:border-midnight-border font-mono text-midnight dark:text-ivory"
              >
                <span>Edit Corporate Profile</span>
                <span>→</span>
              </Link>
              <Link
                to="/recruiter/inbox"
                className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7F0] dark:hover:bg-midnight border border-[#E2D9C8] dark:border-midnight-border font-mono text-midnight dark:text-ivory"
              >
                <span>Registrar Dispatch Inbox</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
