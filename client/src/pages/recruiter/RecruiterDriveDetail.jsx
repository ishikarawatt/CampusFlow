// Recruiter Drive Detail — Complete tabbed workspace (Overview, Eligibility, Applicants with bulk actions & resume links, Test, Interviews, Offers & Results).

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { drives as drivesApi, recruiter as recruiterApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Badge from '../../components/Badge.jsx';
import Stepper from '../../components/Stepper.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import Button from '../../components/Button.jsx';
import StatCard from '../../components/StatCard.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import SlideOver from '../../components/SlideOver.jsx';
import {
  StampBadge,
  LedgerStrip,
  LedgerTable,
  Dossier,
  AdmitCard,
  TimelineRule,
  MarginNote,
} from '../../components/signature';
import {
  Calendar,
  Users,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  ExternalLink,
  CheckSquare,
  Square,
  PlusCircle,
  AlertCircle,
  DollarSign,
  Ban,
  RefreshCw,
} from 'lucide-react';

const STAGE_META = {
  open: { label: 'Accepting Applications', variant: 'success' },
  testing: { label: 'Test Scheduled', variant: 'info' },
  interviews: { label: 'Interviews Scheduled', variant: 'warning' },
  closed: { label: 'Closed', variant: 'neutral' },
  draft: { label: 'Draft', variant: 'neutral' },
};

const STATUS_VARIANT = {
  applied: 'info',
  test_taken: 'warning',
  shortlisted: 'success',
  rejected: 'danger',
  selected: 'success',
  withdrawn: 'neutral',
};

export default function RecruiterDriveDetail() {
  const { id } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [drive, setDrive] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [tab, setTab] = useState('overview');
  const [busy, setBusy] = useState(null);

  // Applicants Tab State
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantTotal, setApplicantTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('applied_desc');
  const [selectedAppIds, setSelectedAppIds] = useState([]);

  // Offers Tab State
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [extendOfferModalOpen, setExtendOfferModalOpen] = useState(false);
  const [offerForm, setOfferForm] = useState({
    application_id: '',
    package_lpa: '',
    joining_date: '',
    note: '',
  });

  // Dialog States
  const [inspectedApplicant, setInspectedApplicant] = useState(null);
  const [bulkActionTarget, setBulkActionTarget] = useState(null); // 'shortlist' | 'reject'
  const [withdrawOfferTarget, setWithdrawOfferTarget] = useState(null); // offer object
  const [scheduleConfirmOpen, setScheduleConfirmOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch Drive & Pipeline Details
  // -------------------------------------------------------------------------
  const loadDrive = async () => {
    try {
      setLoading(true);
      setForbidden(false);
      const [{ data: d }, { data: p }] = await Promise.all([
        drivesApi.get(id),
        drivesApi.pipeline(id),
      ]);
      setDrive(d.drive ?? d);
      setPipeline(p);
    } catch (err) {
      if (err?.response?.status === 403) {
        setForbidden(true);
      }
      toast(errMsg(err, 'Could not load this placement drive.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // -------------------------------------------------------------------------
  // Fetch Paginated Applicants
  // -------------------------------------------------------------------------
  const fetchApplicants = useCallback(async () => {
    try {
      setApplicantsLoading(true);
      const res = await recruiterApi.getApplicants(id, {
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort: sortBy,
      });
      setApplicants(res.data?.applicants ?? []);
      setApplicantTotal(res.data?.total ?? 0);
      setSelectedAppIds([]);
    } catch (err) {
      toast(errMsg(err, 'Could not fetch applicants list.'), 'danger');
    } finally {
      setApplicantsLoading(false);
    }
  }, [id, page, pageSize, search, statusFilter, sortBy, toast]);

  useEffect(() => {
    if (tab === 'applicants') {
      fetchApplicants();
    }
  }, [tab, fetchApplicants]);

  // -------------------------------------------------------------------------
  // Fetch Offers
  // -------------------------------------------------------------------------
  const fetchOffers = useCallback(async () => {
    try {
      setOffersLoading(true);
      const res = await recruiterApi.getOffers(id);
      setOffers(res.data?.offers ?? []);
    } catch (err) {
      toast(errMsg(err, 'Could not load drive offers.'), 'danger');
    } finally {
      setOffersLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (tab === 'results' || tab === 'offers') {
      fetchOffers();
    }
  }, [tab, fetchOffers]);

  // -------------------------------------------------------------------------
  // Pipeline Actions
  // -------------------------------------------------------------------------
  const handleScheduleTests = async () => {
    setBusy('tests');
    try {
      const { data } = await drivesApi.scheduleTests(id);
      toast(
        `Scheduled ${data.sessions} test session${data.sessions !== 1 ? 's' : ''} for ${data.assigned} students.`,
        'success'
      );
      setScheduleConfirmOpen(false);
      loadDrive();
    } catch (err) {
      toast(errMsg(err, 'Could not schedule tests.'), 'danger');
    } finally {
      setBusy(null);
    }
  };

  const handlePublishResults = async () => {
    setBusy('results');
    try {
      const { data } = await drivesApi.publishResults(id);
      toast(
        `Shortlisted ${data.shortlisted} students and generated ${data.interviews} interview slots.`,
        'success'
      );
      setPublishConfirmOpen(false);
      loadDrive();
    } catch (err) {
      toast(errMsg(err, 'Could not publish results.'), 'danger');
    } finally {
      setBusy(null);
    }
  };

  // -------------------------------------------------------------------------
  // Bulk Applicant Actions
  // -------------------------------------------------------------------------
  const handleBulkActionConfirm = async () => {
    if (!bulkActionTarget || selectedAppIds.length === 0) return;
    try {
      setBusy('bulk');
      await recruiterApi.bulkApplicants(id, {
        application_ids: selectedAppIds,
        action: bulkActionTarget,
      });
      toast(
        `Successfully ${bulkActionTarget === 'shortlist' ? 'shortlisted' : 'rejected'} ${selectedAppIds.length} candidate(s).`,
        'success'
      );
      setBulkActionTarget(null);
      setSelectedAppIds([]);
      fetchApplicants();
      loadDrive();
    } catch (err) {
      toast(errMsg(err, 'Bulk action failed.'), 'danger');
    } finally {
      setBusy(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedAppIds.length === applicants.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(applicants.map((a) => a.id));
    }
  };

  const toggleSelectApp = (appId) => {
    if (selectedAppIds.includes(appId)) {
      setSelectedAppIds(selectedAppIds.filter((item) => item !== appId));
    } else {
      setSelectedAppIds([...selectedAppIds, appId]);
    }
  };

  // -------------------------------------------------------------------------
  // Offer Actions
  // -------------------------------------------------------------------------
  const handleExtendOfferSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setBusy('offer');
      await recruiterApi.createOffer(id, {
        application_id: Number(offerForm.application_id),
        package_lpa: parseFloat(offerForm.package_lpa),
        joining_date: offerForm.joining_date || undefined,
        note: offerForm.note || undefined,
      });
      toast('Placement offer extended successfully.', 'success');
      setExtendOfferModalOpen(false);
      setOfferForm({ application_id: '', package_lpa: '', joining_date: '', note: '' });
      fetchOffers();
      loadDrive();
    } catch (err) {
      toast(errMsg(err, 'Failed to extend offer.'), 'danger');
    } finally {
      setBusy(null);
    }
  };

  const handleWithdrawOfferConfirm = async () => {
    if (!withdrawOfferTarget) return;
    try {
      setBusy('withdraw_offer');
      await recruiterApi.withdrawOffer(withdrawOfferTarget.id);
      toast('Offer withdrawn successfully.', 'success');
      setWithdrawOfferTarget(null);
      fetchOffers();
      loadDrive();
    } catch (err) {
      toast(errMsg(err, 'Could not withdraw offer.'), 'danger');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <Skeleton className="h-48 w-full rounded-[10px]" />
        <Skeleton className="h-64 w-full rounded-[10px]" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <EmptyState
        title="Access Denied"
        message="You are not authorized to view or manage this placement drive. Recruiters may only access drives owned by their company."
        action={
          <Link to="/recruiter/drives">
            <Button variant="primary">Back to Drives</Button>
          </Link>
        }
      />
    );
  }

  if (!drive) {
    return (
      <EmptyState
        title="Drive Not Found"
        message="The requested placement drive does not exist or has been archived."
        action={
          <Link to="/recruiter/drives">
            <Button variant="primary">Back to Drives</Button>
          </Link>
        }
      />
    );
  }

  const stage = pipeline?.stage ?? drive.status;
  const stageIdx = { open: 0, testing: 1, interviews: 2, closed: 3, draft: 0 }[stage] ?? 0;
  const pipeSteps = [
    {
      key: 'apply',
      label: 'Applications',
      state: stageIdx > 0 ? 'done' : 'current',
      detail: `${pipeline?.applied ?? 0} applied`,
    },
    {
      key: 'test',
      label: 'Test Sessions',
      state: stageIdx > 1 ? 'done' : stageIdx === 1 ? 'current' : 'todo',
      detail: pipeline?.test_sessions ? `${pipeline.test_sessions} sessions` : drive.test_date ? formatDate(drive.test_date).split(',')[0] : '',
    },
    {
      key: 'result',
      label: 'Results & Cutoffs',
      state: stageIdx > 2 ? 'done' : stageIdx === 2 ? 'current' : 'todo',
      detail: pipeline?.tests_taken ? `${pipeline.tests_taken} taken` : '',
    },
    {
      key: 'interview',
      label: 'Interviews & Offers',
      state: stageIdx >= 3 ? 'done' : stageIdx === 2 ? 'current' : 'todo',
      detail: pipeline?.interviews ? `${pipeline.interviews} slots` : '',
    },
  ];

  const canScheduleTests = stage === 'open' && (pipeline?.applied ?? 0) > 0 && (pipeline?.questions ?? 0) > 0;
  const canPublish = stage === 'testing' && (pipeline?.tests_taken ?? 0) > 0;

  const workspaceTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'eligibility', label: 'Eligibility' },
    { id: 'applicants', label: `Applicants (${pipeline?.applied ?? applicants.length})` },
    { id: 'test', label: 'Test & Questions' },
    { id: 'results', label: `Offers & Results (${offers.length})` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={drive.title}
        subtitle={`${drive.company?.name || 'Partner'} · Placement Workspace`}
        breadcrumbs={[
          { label: 'Recruiter', to: '/recruiter' },
          { label: 'Drives', to: '/recruiter/drives' },
          { label: drive.title },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            {stage === 'open' && (
              <Button
                variant="primary"
                size="sm"
                disabled={!canScheduleTests || busy === 'tests'}
                onClick={() => setScheduleConfirmOpen(true)}
              >
                {busy === 'tests' ? 'Scheduling...' : 'Schedule Tests →'}
              </Button>
            )}
            {stage === 'testing' && (
              <Button
                variant="primary"
                size="sm"
                disabled={!canPublish || busy === 'results'}
                onClick={() => setPublishConfirmOpen(true)}
              >
                {busy === 'results' ? 'Publishing...' : 'Publish Results & Setup Interviews →'}
              </Button>
            )}
          </div>
        }
      />

      {/* Stepper Pipeline Card */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Current Pipeline Stage:
            </span>
            <StampBadge variant={STAGE_META[stage]?.variant ?? 'neutral'} size="sm">
              {STAGE_META[stage]?.label ?? stage}
            </StampBadge>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            Drive Deadline: {formatDate(drive.application_deadline)}
          </span>
        </div>
        <Stepper steps={pipeSteps} current={pipeSteps[stageIdx]?.key ?? 'apply'} />
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="border-b border-[var(--border-color)] flex items-center gap-1 overflow-x-auto">
        {workspaceTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setSelectedAppIds([]);
            }}
            className={`px-4 py-2.5 text-xs font-serif font-bold tracking-wide transition-all border-b-2 whitespace-nowrap ${
              tab === t.id
                ? 'border-[#D9B36C] text-[#D9B36C]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <LedgerStrip
            items={[
              { label: 'APPLICANTS', value: pipeline?.applied ?? 0, unit: 'Submissions' },
              { label: 'ASSESSMENTS TAKEN', value: pipeline?.tests_taken ?? 0, unit: 'Evaluated' },
              { label: 'SHORTLISTED', value: pipeline?.shortlisted ?? 0, unit: 'Candidates' },
              { label: 'OFFERS REGISTERED', value: pipeline?.selected ?? offers.length, unit: 'Extended' },
            ]}
          />

          <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-6 shadow-xs space-y-3">
            <h3 className="text-base font-serif font-bold text-midnight dark:text-ivory">Job Description & Position Profile</h3>
            <p className="text-sm text-midnight/80 dark:text-brandMuted whitespace-pre-line leading-relaxed">
              {drive.description || 'No formal job description provided for this placement drive.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab: Eligibility */}
      {tab === 'eligibility' && (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-4">
          <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">Eligibility Parameters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Eligible Branches</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                {(drive.allowed_branches ?? []).join(', ') || 'All Branches'}
              </p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Minimum CGPA</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.min_cgpa}</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Maximum Active Backlogs</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.max_backlogs ?? 0}</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Qualifying Test Cutoff</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.min_test_score}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Applicants */}
      {tab === 'applicants' && (
        <div className="space-y-4">
          {/* Filter Bar with Status & Sort Selectors */}
          <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-4 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search candidates by name, roll no, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-app)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none font-mono"
              >
                <option value="all">All Statuses</option>
                <option value="applied">Applied</option>
                <option value="test_taken">Test Taken</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none font-mono"
              >
                <option value="applied_desc">Newest First</option>
                <option value="applied_asc">Oldest First</option>
                <option value="cgpa_desc">Highest CGPA</option>
                <option value="cgpa_asc">Lowest CGPA</option>
                <option value="test_score_desc">Highest Test Score</option>
                <option value="test_score_asc">Lowest Test Score</option>
              </select>
            </div>
          </div>

          {/* Bulk Action Sticky Bar (Visible when >= 1 candidate selected) */}
          {selectedAppIds.length > 0 && (
            <div className="bg-[#0B1F1A] text-[#F7F3EA] border border-[#D9B36C] rounded-[8px] px-4 py-3 flex items-center justify-between gap-4 shadow-panel animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="font-bold text-[#D9B36C]">{selectedAppIds.length}</span> applicant(s) selected
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setBulkActionTarget('shortlist')}
                  className="font-bold"
                >
                  Shortlist ({selectedAppIds.length})
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setBulkActionTarget('reject')}
                >
                  Reject ({selectedAppIds.length})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAppIds([])}
                  className="text-xs text-[#F7F3EA]/70 hover:text-white"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Applicants Table */}
          {applicantsLoading ? (
            <Skeleton className="h-64 w-full rounded-[10px]" />
          ) : applicants.length === 0 ? (
            <EmptyState
              title="No matching applicants"
              message={search ? 'No candidates match your search filters.' : 'No candidates have applied to this drive yet.'}
            />
          ) : (
            <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-muted)] font-mono uppercase text-[10px]">
                      <th className="p-3 w-10 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="hover:text-[#D9B36C] transition-colors"
                        >
                          {selectedAppIds.length === applicants.length && applicants.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-[#D9B36C]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Branch</th>
                      <th className="p-3">CGPA</th>
                      <th className="p-3">Backlogs</th>
                      <th className="p-3">Test Score</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Resume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {applicants.map((a) => {
                      const isSelected = selectedAppIds.includes(a.id);
                      return (
                        <tr
                          key={a.id}
                          onClick={() => setInspectedApplicant(a)}
                          className={`hover:bg-[#FAF7F0] dark:hover:bg-midnight/60 transition-colors cursor-pointer ${
                            isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => toggleSelectApp(a.id)}
                              className="hover:text-[#D9B36C] transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#D9B36C]" />
                              ) : (
                                <Square className="w-4 h-4 text-[var(--text-muted)]" />
                              )}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="font-serif font-bold text-sm text-[var(--text-primary)] hover:text-emerald dark:hover:text-emerald-light transition-colors">
                              {a.name}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] font-mono">{a.email}</div>
                          </td>
                          <td className="p-3 font-mono font-medium">{a.roll_no}</td>
                          <td className="p-3 font-mono">{a.branch}</td>
                          <td className="p-3 font-mono font-bold text-[var(--text-primary)]">
                            {a.cgpa.toFixed(2)}
                          </td>
                          <td className="p-3 font-mono">{a.backlogs}</td>
                          <td className="p-3 font-mono font-bold">
                            {a.test_score != null ? (
                              <span className="text-[#0F7B5F] dark:text-[#D9B36C]">
                                {a.test_score.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)] font-normal">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <StampBadge variant={STATUS_VARIANT[a.status] || 'neutral'} size="sm">
                              {a.status?.replace('_', ' ').toUpperCase()}
                            </StampBadge>
                          </td>
                          <td className="p-3 text-right">
                            {a.has_resume ? (
                              <a
                                href={a.resume_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-[#0F7B5F] hover:underline font-mono font-semibold"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Resume ↗
                              </a>
                            ) : (
                              <span className="text-[var(--text-muted)] italic font-mono text-[11px]">
                                No file
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {applicantTotal > pageSize && (
                <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, applicantTotal)} of {applicantTotal} applicants
                  </span>
                  <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(applicantTotal / pageSize)}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Test & Questions */}
      {tab === 'test' && (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">Aptitude Test Structure</h3>
            <Badge variant="info">{pipeline?.questions ?? 0} Questions Loaded</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Test Duration</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.test_duration_min} Minutes</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Test Date</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                {drive.test_date ? formatDate(drive.test_date) : 'Scheduled with pipeline'}
              </p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Qualifying Cutoff</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.min_test_score}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Offers & Results */}
      {(tab === 'results' || tab === 'offers') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">
                Drive Placement Offers ({offers.length})
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Extend formal job offers to shortlisted or selected candidates.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={() => {
                setOfferForm({
                  application_id: '',
                  package_lpa: drive.package_lpa || '',
                  joining_date: '',
                  note: '',
                });
                setExtendOfferModalOpen(true);
              }}
            >
              Extend Offer
            </Button>
          </div>

          {offersLoading ? (
            <Skeleton className="h-48 w-full rounded-[10px]" />
          ) : offers.length === 0 ? (
            <EmptyState
              title="No offers extended yet"
              message="Shortlist candidates from the Applicants tab, then extend formal compensation offers."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setExtendOfferModalOpen(true)}
                >
                  Extend First Offer
                </Button>
              }
            />
          ) : (
            <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-muted)] font-mono uppercase text-[10px]">
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Branch</th>
                      <th className="p-3">Package (LPA)</th>
                      <th className="p-3">Joining Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Responded</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {offers.map((off) => (
                      <tr key={off.id} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                        <td className="p-3">
                          <div className="font-serif font-bold text-sm text-[var(--text-primary)]">
                            {off.name}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] font-mono">{off.email}</div>
                        </td>
                        <td className="p-3 font-mono font-medium">{off.roll_no}</td>
                        <td className="p-3 font-mono">{off.branch}</td>
                        <td className="p-3 font-mono font-bold text-[#D9B36C]">
                          ₹{Number(off.package_lpa).toFixed(2)} LPA
                        </td>
                        <td className="p-3 font-mono text-[var(--text-muted)]">
                          {off.joining_date ? new Date(off.joining_date).toLocaleDateString() : 'TBD'}
                        </td>
                        <td className="p-3">
                          <StampBadge
                            variant={
                              off.status === 'accepted'
                                ? 'success'
                                : off.status === 'offered'
                                ? 'gold'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {off.status?.toUpperCase()}
                          </StampBadge>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[var(--text-muted)]">
                          {off.responded_at ? new Date(off.responded_at).toLocaleDateString() : 'Awaiting response'}
                        </td>
                        <td className="p-3 text-right">
                          {off.status === 'offered' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setWithdrawOfferTarget(off)}
                              className="text-xs"
                            >
                              Withdraw
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Extend Formal Offer */}
      <Modal
        open={extendOfferModalOpen}
        onClose={() => setExtendOfferModalOpen(false)}
        title="Extend Placement Offer"
      >
        <form onSubmit={handleExtendOfferSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono">
              Select Candidate / Application ID
            </label>
            <select
              value={offerForm.application_id}
              onChange={(e) => setOfferForm({ ...offerForm, application_id: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C] font-mono"
            >
              <option value="">-- Choose Candidate --</option>
              {applicants
                .filter((a) => a.status === 'shortlisted' || a.status === 'selected')
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.roll_no} · {a.branch} · CGPA {a.cgpa.toFixed(2)}) — Status: {a.status}
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Note: Offers can be extended to candidates who have been Shortlisted or Selected.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono">
                Annual Package (LPA) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                placeholder="e.g. 18.5"
                value={offerForm.package_lpa}
                onChange={(e) => setOfferForm({ ...offerForm, package_lpa: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono">
                Expected Joining Date
              </label>
              <input
                type="date"
                value={offerForm.joining_date}
                onChange={(e) => setOfferForm({ ...offerForm, joining_date: e.target.value })}
                className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono">
              Offer Note / Welcome Message
            </label>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Congratulations! We were impressed with your technical rounds and problem-solving abilities..."
              value={offerForm.note}
              onChange={(e) => setOfferForm({ ...offerForm, note: e.target.value })}
              className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setExtendOfferModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={busy === 'offer'}
              className="flex items-center gap-1.5"
            >
              {busy === 'offer' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
              {busy === 'offer' ? 'Sending Offer...' : 'Extend Formal Offer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Bulk Action Dialog */}
      <ConfirmDialog
        open={!!bulkActionTarget}
        title={`${bulkActionTarget === 'shortlist' ? 'Shortlist' : 'Reject'} ${selectedAppIds.length} Candidate(s)?`}
        message={`Are you sure you want to ${bulkActionTarget} all ${selectedAppIds.length} selected candidate(s)? This will update their application state and send notifications.`}
        confirmLabel={bulkActionTarget === 'shortlist' ? 'Shortlist Candidates' : 'Reject Candidates'}
        variant={bulkActionTarget === 'shortlist' ? 'primary' : 'danger'}
        loading={busy === 'bulk'}
        onConfirm={handleBulkActionConfirm}
        onCancel={() => setBulkActionTarget(null)}
      />

      {/* Confirm Withdraw Offer Dialog */}
      <ConfirmDialog
        open={!!withdrawOfferTarget}
        title="Withdraw Placement Offer?"
        message={`Are you sure you want to withdraw the placement offer extended to ${withdrawOfferTarget?.name} (${withdrawOfferTarget?.package_lpa} LPA)?`}
        confirmLabel="Withdraw Offer"
        variant="danger"
        loading={busy === 'withdraw_offer'}
        onConfirm={handleWithdrawOfferConfirm}
        onCancel={() => setWithdrawOfferTarget(null)}
      />

      {/* Confirm Schedule Tests Dialog */}
      <ConfirmDialog
        open={scheduleConfirmOpen}
        title="Schedule Test Sessions?"
        message="The scheduler will automatically partition eligible applicants into computer labs based on capacity and generate student seat assignments."
        confirmLabel="Schedule Now"
        variant="primary"
        loading={busy === 'tests'}
        onConfirm={handleScheduleTests}
        onCancel={() => setScheduleConfirmOpen(false)}
      />

      {/* Confirm Publish Results Dialog */}
      <ConfirmDialog
        open={publishConfirmOpen}
        title="Publish Results & Setup Interviews?"
        message="This will calculate qualifying cutoffs, shortlist students above the threshold, and configure interview panel allocations."
        confirmLabel="Publish & Setup"
        variant="primary"
        loading={busy === 'results'}
        onConfirm={handlePublishResults}
        onCancel={() => setPublishConfirmOpen(false)}
      />

      {/* Slide-over Applicant Dossier Inspector */}
      <SlideOver
        isOpen={Boolean(inspectedApplicant)}
        onClose={() => setInspectedApplicant(null)}
        title={inspectedApplicant?.name ?? 'Candidate Dossier'}
        subtitle={inspectedApplicant?.roll_no ?? 'Applicant'}
        width="wide"
      >
        {inspectedApplicant && (
          <Dossier
            title={inspectedApplicant.name}
            subTitle={`${inspectedApplicant.branch} • Placement Applicant`}
            registrationCode={inspectedApplicant.roll_no}
            status={inspectedApplicant.status?.replace('_', ' ').toUpperCase()}
            statusVariant={STATUS_VARIANT[inspectedApplicant.status] || 'neutral'}
            fields={[
              { label: 'CANDIDATE EMAIL', value: inspectedApplicant.email },
              { label: 'INSTITUTIONAL ROLL NO', value: inspectedApplicant.roll_no },
              { label: 'ACADEMIC DEPARTMENT', value: inspectedApplicant.branch },
              { label: 'CUMULATIVE CGPA', value: `${inspectedApplicant.cgpa?.toFixed(2)} / 10.0` },
              { label: 'ACTIVE BACKLOGS', value: String(inspectedApplicant.backlogs ?? 0) },
              {
                label: 'APTITUDE SCORE',
                value:
                  inspectedApplicant.test_score != null
                    ? `${inspectedApplicant.test_score.toFixed(1)}%`
                    : 'Not Evaluated',
              },
            ]}
            documents={
              inspectedApplicant.has_resume
                ? [
                    {
                      name: `${inspectedApplicant.name} - Verified Resume.pdf`,
                      meta: 'OFFICIAL STUDENT RESUME',
                      action: (
                        <a
                          href={inspectedApplicant.resume_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs font-mono font-semibold text-emerald hover:underline border border-emerald-700/30 rounded"
                        >
                          Download PDF ↗
                        </a>
                      ),
                    },
                  ]
                : []
            }
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    handleBulkAction('reject');
                    setInspectedApplicant(null);
                  }}
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setOfferForm({
                      application_id: inspectedApplicant.id,
                      package_lpa: drive.package_lpa || '',
                      joining_date: '',
                      note: '',
                    });
                    setExtendOfferModalOpen(true);
                    setInspectedApplicant(null);
                  }}
                >
                  Extend Placement Offer
                </Button>
              </div>
            }
          />
        )}
      </SlideOver>
    </div>
  );
}
