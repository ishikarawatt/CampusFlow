// Recruiter Drive Detail — Complete tabbed workspace (Overview, Eligibility, Applicants, Test, Interviews, Results).

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { drives as drivesApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Badge from '../../components/Badge.jsx';
import DataTable from '../../components/DataTable.jsx';
import Stepper from '../../components/Stepper.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import Button from '../../components/Button.jsx';
import StatCard from '../../components/StatCard.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import { Calendar, Users, Award, CheckCircle2, Clock, FileText } from 'lucide-react';

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
};

export default function RecruiterDriveDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [drive, setDrive] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [apps, setApps] = useState([]);
  const [tab, setTab] = useState('overview');
  const [busy, setBusy] = useState(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const [{ data: d }, { data: p }, { data: a }] = await Promise.all([
        drivesApi.get(id),
        drivesApi.pipeline(id),
        drivesApi.applications(id),
      ]);
      setDrive(d.drive ?? d);
      setPipeline(p);
      setApps(a ?? []);
    } catch (err) {
      toast(errMsg(err, 'Could not load this drive.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const scheduleTests = async () => {
    setBusy('tests');
    try {
      const { data } = await drivesApi.scheduleTests(id);
      toast(
        `Scheduled ${data.sessions} test session${data.sessions !== 1 ? 's' : ''} for ${data.assigned} students.`,
        'success'
      );
      load();
    } catch (err) {
      toast(errMsg(err, 'Could not schedule tests.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const publishResults = async () => {
    setBusy('results');
    try {
      const { data } = await drivesApi.publishResults(id);
      toast(
        `Shortlisted ${data.shortlisted} students and built ${data.interviews} interview slots.`,
        'success'
      );
      load();
    } catch (err) {
      toast(errMsg(err, 'Could not publish results.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const markSelected = async (studentId, name) => {
    try {
      await drivesApi.markSelected(id, studentId);
      toast(`${name} marked as selected.`, 'success');
      const { data: a } = await drivesApi.applications(id);
      setApps(a ?? []);
    } catch (err) {
      toast(errMsg(err, 'Could not mark as selected.'), 'error');
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
      label: 'Interviews',
      state: stageIdx >= 3 ? 'done' : stageIdx === 2 ? 'current' : 'todo',
      detail: pipeline?.interviews ? `${pipeline.interviews} slots` : '',
    },
  ];

  const canScheduleTests = stage === 'open' && (pipeline?.applied ?? 0) > 0 && (pipeline?.questions ?? 0) > 0;
  const canPublish = stage === 'testing' && (pipeline?.tests_taken ?? 0) > 0;

  const workspaceTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'eligibility', label: 'Eligibility' },
    { id: 'applicants', label: `Applicants (${apps.length})` },
    { id: 'test', label: 'Test & Questions' },
    { id: 'results', label: 'Results' },
    { id: 'interviews', label: 'Interviews' },
  ];

  const filteredApps = apps.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.student?.name?.toLowerCase().includes(q) ||
      a.student?.roll_no?.toLowerCase().includes(q) ||
      a.student?.branch?.toLowerCase().includes(q)
    );
  });

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
                onClick={scheduleTests}
                disabled={!canScheduleTests || busy === 'tests'}
                loading={busy === 'tests'}
              >
                Schedule Tests
              </Button>
            )}
            {stage === 'testing' && (
              <Button
                variant="primary"
                onClick={publishResults}
                disabled={!canPublish || busy === 'results'}
                loading={busy === 'results'}
              >
                Publish Results
              </Button>
            )}
          </div>
        }
      />

      {/* Stepper Pipeline */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <Badge variant={STAGE_META[stage]?.variant ?? 'neutral'}>
            {STAGE_META[stage]?.label ?? stage}
          </Badge>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Apply by: {formatDate(drive.application_deadline).split(',')[0]}
          </span>
        </div>
        <Stepper steps={pipeSteps} />
      </div>

      {/* Stat Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Applied" value={pipeline?.applied ?? 0} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Tests Taken" value={pipeline?.tests_taken ?? 0} icon={<FileText className="w-5 h-5" />} />
        <StatCard
          label="Avg Score"
          value={pipeline?.avg_score != null ? `${Number(pipeline.avg_score).toFixed(1)}%` : '—'}
          icon={<Award className="w-5 h-5" />}
        />
        <StatCard label="Shortlisted" value={pipeline?.shortlisted ?? 0} icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatCard label="Interviews" value={pipeline?.interviews ?? 0} icon={<Calendar className="w-5 h-5" />} />
      </div>

      {/* Segmented Workspace Tabs */}
      <FilterBar
        tabs={workspaceTabs}
        activeTab={tab}
        onTabChange={setTab}
      />

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle">
            <h3 className="text-base font-serif font-bold text-[var(--text-primary)] mb-2">Role Overview</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {drive.description || 'No detailed role description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Graduation Year</span>
              <p className="font-bold text-sm text-[var(--text-primary)] mt-0.5">{drive.graduation_year || 2027}</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Min CGPA</span>
              <p className="font-bold text-sm text-[var(--text-primary)] mt-0.5">{drive.min_cgpa}</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Test Duration</span>
              <p className="font-bold text-sm text-[var(--text-primary)] mt-0.5">{drive.test_duration_min} min</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Interview Length</span>
              <p className="font-bold text-sm text-[var(--text-primary)] mt-0.5">{drive.interview_duration_min} min</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Eligibility */}
      {tab === 'eligibility' && (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-4">
          <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">Eligibility Criteria</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Eligible Branches</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                {(drive.allowed_branches ?? []).join(', ') || 'All Branches'}
              </p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Maximum Active Backlogs</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.max_backlogs ?? 0}</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Cutoff Score for Interview</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.min_test_score}%</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Max Shortlist Cap</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.max_shortlist ?? 20} candidates</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Applicants */}
      {tab === 'applicants' && (
        <div className="space-y-4">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search applicants by name, roll, or branch..."
          />
          {filteredApps.length === 0 ? (
            <EmptyState
              title="No applicants found"
              message={search ? 'No candidates match your search.' : 'Eligible students will appear here as they apply.'}
            />
          ) : (
            <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
              <DataTable
                columns={[
                  {
                    key: 'student',
                    label: 'Student Name',
                    render: (a) => (
                      <span className="font-serif font-bold text-sm text-[var(--text-primary)]">
                        {a.student?.name}
                      </span>
                    ),
                  },
                  { key: 'roll', label: 'Roll No', render: (a) => <span className="font-mono text-xs">{a.student?.roll_no ?? '—'}</span> },
                  { key: 'branch', label: 'Branch', render: (a) => <span className="font-mono text-xs">{a.student?.branch ?? '—'}</span> },
                  { key: 'cgpa', label: 'CGPA', render: (a) => <span className="font-mono font-bold text-xs">{a.student?.cgpa ?? '—'}</span> },
                  {
                    key: 'score',
                    label: 'Test Score',
                    render: (a) =>
                      a.test_percentage != null ? (
                        <span className="font-mono font-bold text-xs text-[#0F7B5F] dark:text-[#D9B36C]">
                          {Number(a.test_percentage).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-[var(--text-muted)]">—</span>
                      ),
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (a) => (
                      <Badge variant={STATUS_VARIANT[a.status] ?? 'neutral'}>
                        {a.status?.replace('_', ' ')}
                      </Badge>
                    ),
                  },
                  {
                    key: 'action',
                    label: '',
                    render: (a) =>
                      a.status === 'shortlisted' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => markSelected(a.student.id, a.student.name)}
                        >
                          Select ✓
                        </Button>
                      ) : null,
                  },
                ]}
                rows={filteredApps}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab: Test */}
      {tab === 'test' && (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">Aptitude Test Structure</h3>
            <Badge variant="info">{pipeline?.questions ?? 0} Questions Loaded</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)]">Test Duration</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.test_duration_min} Minutes</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)]">Test Date</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.test_date ? formatDate(drive.test_date) : 'Scheduled with pipeline'}</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)]">Qualifying Cutoff</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.min_test_score}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Results */}
      {tab === 'results' && (
        (() => {
          const taken = apps
            .filter((a) => a.test_percentage != null)
            .sort((x, y) => y.test_percentage - x.test_percentage)
            .map((a, i) => ({ ...a, rank: i + 1 }));

          return taken.length === 0 ? (
            <EmptyState
              title="No test results yet"
              message="Student scores and rank positions will populate here automatically as exams conclude."
            />
          ) : (
            <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
              <DataTable
                columns={[
                  { key: 'rank', label: 'Rank', render: (a) => <span className="font-mono font-bold text-xs">{a.rank}</span> },
                  { key: 'student', label: 'Student', render: (a) => <span className="font-serif font-bold text-sm">{a.student?.name}</span> },
                  {
                    key: 'score',
                    label: 'Score',
                    render: (a) => (
                      <span className="font-mono font-bold text-xs text-[#0F7B5F] dark:text-[#D9B36C]">
                        {Number(a.test_percentage).toFixed(1)}%
                      </span>
                    ),
                  },
                  {
                    key: 'cutoff',
                    label: `Cutoff (${drive.min_test_score}%)`,
                    render: (a) => (
                      <Badge variant={a.test_percentage >= drive.min_test_score ? 'success' : 'danger'}>
                        {a.test_percentage >= drive.min_test_score ? 'Qualified' : 'Below Cutoff'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (a) => (
                      <Badge variant={STATUS_VARIANT[a.status] ?? 'neutral'}>
                        {a.status?.replace('_', ' ')}
                      </Badge>
                    ),
                  },
                ]}
                rows={taken}
              />
            </div>
          );
        })()
      )}

      {/* Tab: Interviews */}
      {tab === 'interviews' && (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-4">
          <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">Interview Timetable & Panels</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)]">Parallel Panels</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.num_interviewers} Panels</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)]">Slot Duration</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{drive.interview_duration_min} Minutes</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)]">Interview Date</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                {drive.interview_date ? formatDate(drive.interview_date) : 'Auto-scheduled post results'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
