// Student Drives — tabs: Eligible / Applied / Closed, FilterBar, SlideOver for detail.

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { drives as drivesApi, student as studentApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import Badge from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import SlideOver from '../../components/SlideOver.jsx';
import Button from '../../components/Button.jsx';
import Stepper from '../../components/Stepper.jsx';
import { Briefcase } from 'lucide-react';

function DriveCard({ detail, onApplied, onOpenPanel }) {
  const { drive, eligibility, my_application, questions_count } = detail;
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();
  const eligible = eligibility?.eligible ?? false;

  const apply = async (e) => {
    e.stopPropagation();
    setApplying(true);
    try {
      await drivesApi.apply(drive.id);
      toast('Applied! Track it under My Journey.', 'success');
      onApplied(drive.id);
    } catch (err) {
      toast(errMsg(err, 'Could not apply.'), 'error');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      onClick={() => onOpenPanel(drive.id)}
      className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5 shadow-subtle hover:border-[var(--brand-accent)]/40 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-[var(--text-muted)] font-mono">{drive.company?.name}</div>
          <h3 className="text-lg font-serif font-bold text-[var(--text-primary)] leading-snug truncate">
            {drive.title}
          </h3>
        </div>
        {my_application
          ? <Badge variant="info">Applied ✓</Badge>
          : eligible
            ? <Badge variant="success">Eligible</Badge>
            : <Badge variant="neutral">Not eligible</Badge>}
      </div>
      {drive.description && <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2">{drive.description}</p>}
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="px-2.5 py-1 rounded-[4px] bg-[var(--bg-subtle)] text-xs font-mono text-[var(--text-secondary)]">CGPA ≥ {drive.min_cgpa}</span>
        <span className="px-2.5 py-1 rounded-[4px] bg-[var(--bg-subtle)] text-xs font-mono text-[var(--text-secondary)]">{(drive.allowed_branches ?? []).join(', ')}</span>
        <span className="px-2.5 py-1 rounded-[4px] bg-[var(--bg-subtle)] text-xs font-mono text-[var(--text-secondary)]">{questions_count ?? 0} questions</span>
      </div>
      {!my_application && !eligible && (eligibility?.reasons?.length > 0) && (
        <p className="text-xs text-[var(--text-muted)] mt-2">Why not: {eligibility.reasons[0]}</p>
      )}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-color)]">
        <span className="text-xs text-[var(--text-muted)] font-mono">Apply by {formatDate(drive.application_deadline).split(',')[0]}</span>
        {my_application ? (
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onOpenPanel(drive.id); }}>Track</Button>
        ) : eligible ? (
          <Button variant="primary" size="sm" onClick={apply} loading={applying}>Apply</Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onOpenPanel(drive.id); }}>Details</Button>
        )}
      </div>
    </div>
  );
}

export default function Drives() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [journey, setJourney] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('eligible');
  const [panelData, setPanelData] = useState(null);

  const load = async () => {
    try {
      const [{ data: open }, { data: j }] = await Promise.all([
        drivesApi.list({ status: 'open' }),
        studentApi.journey().catch(() => ({ data: [] })),
      ]);
      setJourney(j ?? []);
      const details = await Promise.all(open.map((d) => drivesApi.get(d.id).then((r) => r.data).catch(() => null)));
      setItems(details.filter((d) => d && d.drive));
    } catch (err) {
      toast(errMsg(err, 'Could not load drives.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Open slide-over from URL ?panel=drive-<id>
  useEffect(() => {
    const panelId = searchParams.get('panel');
    if (panelId && panelId.startsWith('drive-')) {
      const driveId = panelId.replace('drive-', '');
      const found = items.find((d) => String(d.drive.id) === driveId);
      if (found) setPanelData(found);
    }
  }, [searchParams, items]);

  const openPanel = (driveId) => {
    const found = items.find((d) => d.drive.id === driveId);
    if (found) setPanelData(found);
    setSearchParams({ panel: `drive-${driveId}` }, { replace: true });
  };

  const markApplied = (driveId) => {
    setItems((list) => list.map((d) => d.drive.id === driveId ? { ...d, my_application: { status: 'applied' } } : d));
  };

  const appliedIds = new Set(journey.map((x) => x.drive.id));
  const eligible = items.filter((d) => !d.my_application && (d.eligibility?.eligible));
  const applied = items.filter((d) => d.my_application);
  const closed = []; // no closed drives from the open list

  const tabs = [
    { id: 'eligible', label: 'Eligible', count: eligible.length },
    { id: 'applied', label: 'Applied', count: applied.length },
  ];

  const filtered = (tab === 'eligible' ? eligible : applied).filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return d.drive.title.toLowerCase().includes(q) || d.drive.company?.name?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-56 rounded-[10px]" />
          <Skeleton className="h-56 rounded-[10px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drives"
        subtitle={`${items.length} drive${items.length !== 1 ? 's' : ''} open. Your eligibility is checked on each one.`}
        breadcrumbs={[
          { label: 'Student', to: '/student' },
          { label: 'Drives' },
        ]}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by company or title..."
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={tab === 'eligible' ? 'No eligible drives' : 'No applications yet'}
          message={tab === 'eligible' ? 'When a recruiter publishes a drive you qualify for, it appears here.' : 'Apply to a drive to track it here.'}
          action={tab === 'applied' && eligible.length > 0 ? <Button variant="primary" onClick={() => setTab('eligible')}>View eligible drives</Button> : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((d) => (
            <DriveCard key={d.drive.id} detail={d} onApplied={markApplied} onOpenPanel={openPanel} />
          ))}
        </div>
      )}

      {/* Drive Detail SlideOver */}
      <SlideOver
        panelId={panelData ? `drive-${panelData.drive.id}` : ''}
        title={panelData?.drive.title}
        subtitle={panelData?.drive.company?.name}
        onClose={() => setPanelData(null)}
      >
        {panelData && <DriveDetailPanel data={panelData} onApplied={markApplied} />}
      </SlideOver>
    </div>
  );
}

// Inline drive detail for the SlideOver
function DriveDetailPanel({ data, onApplied }) {
  const { drive, eligibility, my_application, my_result, my_sessions = [], questions_count } = data;
  const { toast } = useToast();
  const [applying, setApplying] = useState(false);

  const apply = async () => {
    setApplying(true);
    try {
      await drivesApi.apply(drive.id);
      toast('Applied! Track it under My Journey.', 'success');
      onApplied(drive.id);
    } catch (err) {
      toast(errMsg(err, 'Could not apply.'), 'error');
    } finally {
      setApplying(false);
    }
  };

  const testSession = my_sessions.find((s) => s.type === 'test');
  const interview = my_sessions.find((s) => s.type === 'interview');

  return (
    <div className="space-y-6">
      {/* Criteria */}
      <div className="grid grid-cols-2 gap-3">
        {[
          ['Min CGPA', drive.min_cgpa],
          ['Branches', (drive.allowed_branches ?? []).join(', ')],
          ['Max backlogs', drive.max_backlogs],
          ['Apply by', formatDate(drive.application_deadline).split(',')[0]],
        ].map(([k, v]) => (
          <div key={k} className="bg-[var(--bg-subtle)] rounded-[6px] px-4 py-3">
            <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide font-mono">{k}</div>
            <div className="font-medium text-sm text-[var(--text-primary)] mt-0.5">{v}</div>
          </div>
        ))}
      </div>

      {drive.description && (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{drive.description}</p>
      )}

      {/* Eligibility / Apply */}
      {!my_application ? (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5">
          {eligibility?.eligible ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-serif font-bold text-sm text-[var(--status-success-text)]">✓ You're eligible for this drive</div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Test: {questions_count ?? 0} questions, {drive.test_duration_min} min.</p>
              </div>
              <Button variant="primary" onClick={apply} loading={applying}>Apply</Button>
            </div>
          ) : (
            <div>
              <div className="font-serif font-bold text-sm text-[var(--status-danger-text)]">Not eligible for this drive</div>
              <ul className="text-xs text-[var(--text-muted)] mt-2 list-disc pl-5 space-y-0.5">
                {(eligibility?.reasons ?? []).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-[var(--text-primary)]">Your Progress</h3>
            <Badge variant="info">{(my_application.status ?? 'applied').replace('_', ' ')}</Badge>
          </div>

          {testSession && (
            <div className="bg-[var(--status-info-bg)] border border-[var(--status-info-border)] rounded-[6px] p-4">
              <div className="font-medium text-sm text-[var(--status-info-text)]">📍 Your test</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">{testSession.title} · {formatDate(testSession.starts_at)}</div>
              {!my_result && (
                <Link to={`/student/tests/${drive.id}`} className="mt-3 inline-block">
                  <Button variant="primary" size="sm">Take test</Button>
                </Link>
              )}
            </div>
          )}

          {my_result && (
            <div className={`rounded-[6px] p-4 border ${Number(my_result.percentage) >= Number(drive.min_test_score) ? 'bg-[var(--status-success-bg)] border-[var(--status-success-border)]' : 'bg-[var(--bg-subtle)] border-[var(--border-color)]'}`}>
              <div className="font-medium text-sm text-[var(--text-primary)]">📊 Result: {Number(my_result.percentage).toFixed(1)}%</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{Number(my_result.score)}/{Number(my_result.total)} marks · cutoff {drive.min_test_score}%</div>
            </div>
          )}

          {interview && (
            <div className="bg-[var(--status-success-bg)] border border-[var(--status-success-border)] rounded-[6px] p-4">
              <div className="font-medium text-sm text-[var(--status-success-text)]">🎤 Interview scheduled</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">{interview.title}{interview.venue ? ` · ${interview.venue}` : ''} · {formatDate(interview.starts_at)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
