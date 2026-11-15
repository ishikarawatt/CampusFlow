// Recruiter Drives — Placement Drives Register
// Upgraded to the Campus Registrar visual language:
// LedgerTable with StampBadge statuses, inline expandable summaries, and mono criteria.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { drives as drivesApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import Button from '../../components/Button.jsx';
import { StampBadge, LedgerTable } from '../../components/signature';
import { PlusCircle, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

const STAGE_VARIANT = {
  open: 'success',
  testing: 'info',
  interviews: 'warning',
  closed: 'neutral',
  draft: 'neutral',
};

export default function MyDrives() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedRowId, setExpandedRowId] = useState(null);

  useEffect(() => {
    drivesApi
      .list()
      .then(({ data }) => setDrives(data ?? []))
      .catch((err) => toast(errMsg(err, 'Could not load drives.'), 'danger'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[6px]" />
        <Skeleton className="h-64 w-full rounded-[6px]" />
      </div>
    );
  }

  const activeCount = drives.filter((d) => d.status !== 'closed').length;
  const closedCount = drives.filter((d) => d.status === 'closed').length;

  const tabs = [
    { id: 'all', label: `All Drives (${drives.length})` },
    { id: 'active', label: `Active (${activeCount})` },
    { id: 'closed', label: `Closed (${closedCount})` },
  ];

  const filteredDrives = drives.filter((d) => {
    if (activeTab === 'active' && d.status === 'closed') return false;
    if (activeTab === 'closed' && d.status !== 'closed') return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.company?.name && d.company.name.toLowerCase().includes(q))
    );
  });

  const columns = [
    {
      header: 'DRIVE IDENTIFIER & TITLE',
      accessor: 'title',
      render: (d) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-midnight/50 dark:text-brandMuted">
              #DRV-{d.id}
            </span>
            <Link
              to={`/recruiter/drives/${d.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-serif font-bold text-sm text-midnight dark:text-ivory hover:text-emerald dark:hover:text-emerald-light transition-colors"
            >
              {d.title}
            </Link>
          </div>
          <span className="text-[11px] font-mono text-midnight/60 dark:text-brandMuted block">
            {d.company?.name || 'Corporate Partner'}
          </span>
        </div>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'status',
      render: (d) => (
        <StampBadge variant={STAGE_VARIANT[d.status] || 'neutral'} size="sm">
          {d.status?.toUpperCase() || 'DRAFT'}
        </StampBadge>
      ),
    },
    {
      header: 'PACKAGE',
      accessor: 'package_lpa',
      mono: true,
      render: (d) => (
        <span className="font-bold text-emerald dark:text-emerald-light">
          {d.package_lpa ? `₹${d.package_lpa} LPA` : '—'}
        </span>
      ),
    },
    {
      header: 'APPLICANTS',
      accessor: (d) => d.counts?.applied ?? 0,
      mono: true,
      align: 'right',
      render: (d) => (
        <span className="tabular-nums font-mono font-semibold">
          {d.counts?.applied ?? 0}
        </span>
      ),
    },
    {
      header: 'SHORTLISTED',
      accessor: (d) => d.counts?.shortlisted ?? 0,
      mono: true,
      align: 'right',
      render: (d) => (
        <span className="tabular-nums font-mono font-semibold text-amber-700 dark:text-amber-400">
          {d.counts?.shortlisted ?? 0}
        </span>
      ),
    },
    {
      header: 'DEADLINE',
      accessor: 'application_deadline',
      mono: true,
      render: (d) => (
        <span className="text-midnight/70 dark:text-brandMuted">
          {d.application_deadline ? formatDate(d.application_deadline).split(',')[0] : '—'}
        </span>
      ),
    },
    {
      header: '',
      render: (d) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedRowId(expandedRowId === d.id ? null : d.id);
          }}
          className="p-1 rounded hover:bg-[#EFE9DC] dark:hover:bg-midnight text-midnight/60 dark:text-brandMuted"
          title="Toggle Details"
        >
          {expandedRowId === d.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Drives Register"
        subtitle="Manage end-to-end recruitment pipelines, screening cutoffs, and assessment sessions."
        breadcrumbs={[{ label: 'Recruiter', to: '/recruiter' }, { label: 'Drives' }]}
        actions={
          <Link to="/recruiter/drives/new">
            <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
              Add Drive Blueprint
            </Button>
          </Link>
        }
      />

      <div className="bg-white dark:bg-midnight-surface border border-[#D9CEBA] dark:border-midnight-border rounded-[6px] p-3">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search drives by title or corporate sponsor..."
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {filteredDrives.length === 0 ? (
        <EmptyState
          title={search ? 'No matching drives recorded' : 'No drives registered'}
          message={
            search
              ? 'Modify your filter criteria or search keyword.'
              : 'Add your first placement drive blueprint to start accepting applications.'
          }
          action={
            !search && (
              <Link to="/recruiter/drives/new">
                <Button variant="primary">Create Placement Drive</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <LedgerTable
            columns={columns}
            data={filteredDrives}
            keyField="id"
            onRowClick={(d) => navigate(`/recruiter/drives/${d.id}`)}
          />

          {/* Inline Expanded Summary if open */}
          {expandedRowId && (() => {
            const drive = filteredDrives.find((d) => d.id === expandedRowId);
            if (!drive) return null;
            return (
              <div className="p-4 bg-[#FAF7F0] dark:bg-midnight-surface border border-[#D9CEBA] dark:border-midnight-border rounded-[6px] text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2D9C8] dark:border-midnight-border">
                  <span className="font-mono font-bold uppercase text-[10px] text-midnight/50 dark:text-brandMuted">
                    DRIVE CRITERIA SUMMARY: {drive.title}
                  </span>
                  <Link
                    to={`/recruiter/drives/${drive.id}`}
                    className="font-mono font-semibold text-emerald hover:underline flex items-center gap-1"
                  >
                    Open Workspace <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div>
                    <span className="block text-[10px] text-midnight/50 dark:text-brandMuted">MIN CGPA</span>
                    <span className="font-bold">{drive.min_cgpa ?? '0.0'} / 10.0</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-midnight/50 dark:text-brandMuted">MAX BACKLOGS</span>
                    <span className="font-bold">{drive.max_backlogs ?? 0}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-midnight/50 dark:text-brandMuted">TEST CUTOFF</span>
                    <span className="font-bold">{drive.min_test_score ?? 50}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-midnight/50 dark:text-brandMuted">ALLOWED DEPTS</span>
                    <span className="truncate block">{(drive.allowed_branches ?? []).join(', ') || 'All'}</span>
                  </div>
                </div>
                {drive.description && (
                  <p className="text-midnight/70 dark:text-brandMuted pt-1 italic">
                    "{drive.description}"
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
