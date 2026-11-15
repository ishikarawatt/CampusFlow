// Student Drives — Approved Campus Placement Drives Register
// Styled with the Campus Registrar visual language:
// StampBadge statuses, ruled borders, mono criteria, and Dossier slide-over inspection.

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { drives as drivesApi, student as studentApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import SlideOver from '../../components/SlideOver.jsx';
import Button from '../../components/Button.jsx';
import { StampBadge, Dossier, MarginNote } from '../../components/signature';
import { Briefcase, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
      toast('Application formally registered! Track progression under My Journey.', 'success');
      onApplied(drive.id);
    } catch (err) {
      toast(errMsg(err, 'Failed to register application.'), 'danger');
    } finally {
      setApplying(false);
    }
  };

  let stampVariant = 'neutral';
  let stampText = 'NOT ELIGIBLE';
  if (my_application) {
    stampVariant = 'info';
    stampText = 'APPLIED';
  } else if (eligible) {
    stampVariant = 'success';
    stampText = 'ELIGIBLE';
  }

  return (
    <div
      onClick={() => onOpenPanel(drive.id)}
      className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-5 hover:border-emerald-600 dark:hover:border-emerald-500 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <span className="text-[11px] font-mono tracking-wider text-midnight/60 dark:text-brandMuted uppercase block">
              {drive.company?.name || 'Recruiting Partner'}
            </span>
            <h3 className="text-base font-serif font-bold text-midnight dark:text-ivory leading-snug truncate">
              {drive.title}
            </h3>
          </div>
          <StampBadge variant={stampVariant} size="sm">
            {stampText}
          </StampBadge>
        </div>

        {drive.package_lpa && (
          <div className="my-2 flex items-baseline gap-1.5 font-mono">
            <span className="text-xs text-midnight/50 dark:text-brandMuted">PACKAGE:</span>
            <span className="text-sm font-bold text-emerald dark:text-emerald-light">
              ₹{drive.package_lpa} LPA
            </span>
          </div>
        )}

        {drive.description && (
          <p className="text-xs text-midnight/70 dark:text-brandMuted line-clamp-2 leading-relaxed">
            {drive.description}
          </p>
        )}

        {/* Ruled Criteria Badges */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#EFE9DC] dark:border-midnight-border">
          <span className="px-2 py-0.5 rounded-[3px] bg-[#FAF7F0] dark:bg-midnight border border-[#E2D9C8] dark:border-midnight-border text-[11px] font-mono text-midnight/80 dark:text-brandMuted">
            CGPA ≥ {drive.min_cgpa}
          </span>
          <span className="px-2 py-0.5 rounded-[3px] bg-[#FAF7F0] dark:bg-midnight border border-[#E2D9C8] dark:border-midnight-border text-[11px] font-mono text-midnight/80 dark:text-brandMuted">
            {(drive.allowed_branches ?? []).join(', ')}
          </span>
          <span className="px-2 py-0.5 rounded-[3px] bg-[#FAF7F0] dark:bg-midnight border border-[#E2D9C8] dark:border-midnight-border text-[11px] font-mono text-midnight/80 dark:text-brandMuted">
            {questions_count ?? 0} Questions
          </span>
        </div>

        {!my_application && !eligible && eligibility?.reasons?.length > 0 && (
          <div className="mt-2 text-[11px] font-mono text-rose-700 dark:text-rose-400">
            DISQUALIFIED: {eligibility.reasons[0]}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#EFE9DC] dark:border-midnight-border text-xs">
        <span className="text-[11px] text-midnight/60 dark:text-brandMuted font-mono">
          DEADLINE: {formatDate(drive.application_deadline).split(',')[0]}
        </span>
        {my_application ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPanel(drive.id);
            }}
          >
            Track Application
          </Button>
        ) : eligible ? (
          <Button variant="primary" size="sm" onClick={apply} loading={applying}>
            Apply Now
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPanel(drive.id);
            }}
          >
            Inspect
          </Button>
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
      const details = await Promise.all(
        open.map((d) =>
          drivesApi
            .get(d.id)
            .then((r) => r.data)
            .catch(() => null)
        )
      );
      setItems(details.filter((d) => d && d.drive));
    } catch (err) {
      toast(errMsg(err, 'Could not load drives.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const closePanel = () => {
    setPanelData(null);
    setSearchParams({}, { replace: true });
  };

  // Filter logic
  const filtered = items.filter((d) => {
    if (tab === 'eligible' && !d.eligibility?.eligible && !d.my_application) return false;
    if (tab === 'applied' && !d.my_application) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = d.drive.title?.toLowerCase().includes(q);
      const matchCompany = d.drive.company?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany) return false;
    }
    return true;
  });

  const counts = {
    all: items.length,
    eligible: items.filter((d) => d.eligibility?.eligible || d.my_application).length,
    applied: items.filter((d) => d.my_application).length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Approved Placement Drives Register"
        subtitle="Institutional register of verified on-campus recruiting programs and corporate partners."
      />

      {/* Filter and Tab Strip */}
      <div className="bg-white dark:bg-midnight-surface border border-[#D9CEBA] dark:border-midnight-border rounded-[6px] p-3">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search drives by corporate name or role..."
          tabs={[
            { id: 'eligible', label: `Eligible (${counts.eligible})` },
            { id: 'all', label: `All Approved (${counts.all})` },
            { id: 'applied', label: `Applied (${counts.applied})` },
          ]}
          activeTab={tab}
          onTabChange={setTab}
        />
      </div>

      {/* Grid of Ruled Drive Records */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-56 rounded-[6px]" />
          <Skeleton className="h-56 rounded-[6px]" />
          <Skeleton className="h-56 rounded-[6px]" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No drives match the active filter"
          message={
            tab === 'eligible'
              ? 'No open drives match your current CGPA and academic department.'
              : 'No drive records matching the selected search parameters.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((d) => (
            <DriveCard
              key={d.drive.id}
              detail={d}
              onApplied={() => load()}
              onOpenPanel={openPanel}
            />
          ))}
        </div>
      )}

      {/* Slide-over Drive Dossier */}
      <SlideOver
        isOpen={Boolean(panelData)}
        onClose={closePanel}
        title={panelData?.drive?.title ?? 'Drive Details'}
        subtitle={panelData?.drive?.company?.name ?? 'Placement Drive'}
        width="wide"
      >
        {panelData && (
          <DriveDetailPanel
            detail={panelData}
            onApplied={() => {
              load();
              closePanel();
            }}
          />
        )}
      </SlideOver>
    </div>
  );
}

function DriveDetailPanel({ detail, onApplied }) {
  const { drive, eligibility, my_application, my_sessions = [], my_result, questions_count } = detail;
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  const apply = async () => {
    setApplying(true);
    try {
      await drivesApi.apply(drive.id);
      toast('Formally enrolled in drive! Follow progression in My Journey.', 'success');
      onApplied(drive.id);
    } catch (err) {
      toast(errMsg(err, 'Failed to submit application.'), 'danger');
    } finally {
      setApplying(false);
    }
  };

  const testSession = my_sessions.find((s) => s.type === 'test');
  const interview = my_sessions.find((s) => s.type === 'interview');

  return (
    <Dossier
      title={drive.title}
      subTitle={drive.company?.name}
      registrationCode={`DRV-${drive.id}`}
      status={
        my_application
          ? 'APPLICATION REGISTERED'
          : eligibility?.eligible
          ? 'OFFICIALLY ELIGIBLE'
          : 'INELIGIBLE'
      }
      statusVariant={
        my_application ? 'info' : eligibility?.eligible ? 'success' : 'danger'
      }
      fields={[
        { label: 'COMPENSATION PACKAGE', value: drive.package_lpa ? `₹${drive.package_lpa} LPA` : 'As per policy' },
        { label: 'MINIMUM CGPA CUTOFF', value: drive.min_cgpa ? `${drive.min_cgpa} / 10.0` : 'None' },
        { label: 'APPROVED BRANCHES', value: (drive.allowed_branches ?? []).join(', ') || 'All Departments' },
        { label: 'MAX ALLOWED BACKLOGS', value: String(drive.max_backlogs ?? 0) },
        { label: 'EXAMINATION FORMAT', value: `${questions_count ?? 0} Questions, ${drive.test_duration_min ?? 60} Minutes` },
        { label: 'APPLICATION DEADLINE', value: formatDate(drive.application_deadline) },
      ]}
      actions={
        !my_application ? (
          eligibility?.eligible ? (
            <Button variant="primary" onClick={apply} loading={applying}>
              Submit Formal Application
            </Button>
          ) : (
            <span className="text-xs font-mono text-rose-700 dark:text-rose-400">
              Ineligible: {eligibility?.reasons?.[0] || 'Criteria not met'}
            </span>
          )
        ) : (
          <Link to="/student/journey">
            <Button variant="outline">Inspect in My Journey</Button>
          </Link>
        )
      }
      timeline={
        my_application ? (
          <div className="space-y-3">
            {testSession && (
              <div className="p-3 bg-white dark:bg-midnight border border-[#D9CEBA] dark:border-midnight-border rounded-[4px] text-xs">
                <span className="font-mono text-[10px] text-midnight/50 dark:text-brandMuted uppercase block">
                  SCHEDULED TEST SESSION
                </span>
                <span className="font-semibold block">{testSession.title}</span>
                <span className="font-mono text-midnight/60 dark:text-brandMuted block mt-0.5">
                  {formatDate(testSession.starts_at)} {testSession.venue ? `• ${testSession.venue}` : ''}
                </span>
              </div>
            )}
            {my_result && (
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-700/30 rounded-[4px] text-xs">
                <span className="font-mono text-[10px] text-emerald-800 dark:text-emerald-300 uppercase block">
                  EXAM EVALUATION
                </span>
                <span className="font-bold text-emerald-900 dark:text-emerald-200">
                  Score: {Number(my_result.percentage).toFixed(1)}% ({Number(my_result.score)}/{Number(my_result.total)} marks)
                </span>
              </div>
            )}
            {interview && (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-700/30 rounded-[4px] text-xs">
                <span className="font-mono text-[10px] text-amber-800 dark:text-amber-300 uppercase block">
                  INTERVIEW CHAMBER
                </span>
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  {interview.title} • {formatDate(interview.starts_at)}
                </span>
              </div>
            )}
          </div>
        ) : null
      }
    />
  );
}
