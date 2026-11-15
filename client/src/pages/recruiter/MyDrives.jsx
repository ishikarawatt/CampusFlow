// Recruiter Drives — List of all recruitment drives with filtering and stage chips.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { drives as drivesApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import Badge from '../../components/Badge.jsx';
import DataTable from '../../components/DataTable.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import Button from '../../components/Button.jsx';
import { PlusCircle } from 'lucide-react';

const STAGE_VARIANT = {
  open: 'success',
  testing: 'info',
  interviews: 'warning',
  closed: 'neutral',
  draft: 'neutral',
};

export default function MyDrives() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    drivesApi
      .list()
      .then(({ data }) => setDrives(data ?? []))
      .catch((err) => toast(errMsg(err, 'Could not load drives.'), 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <Skeleton className="h-64 w-full rounded-[10px]" />
      </div>
    );
  }

  const activeCount = drives.filter((d) => d.status !== 'closed').length;
  const closedCount = drives.filter((d) => d.status === 'closed').length;

  const tabs = [
    { id: 'all', label: 'All Drives', count: drives.length },
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'closed', label: 'Closed', count: closedCount },
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drives"
        subtitle="Manage end-to-end recruitment pipelines, screening criteria, and exam links."
        breadcrumbs={[{ label: 'Recruiter', to: '/recruiter' }, { label: 'Drives' }]}
        actions={
          <Link to="/recruiter/drives/new">
            <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
              Add Drive
            </Button>
          </Link>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by drive title or company..."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {filteredDrives.length === 0 ? (
        <EmptyState
          title={search ? 'No matching drives' : 'No drives recorded'}
          message={
            search
              ? 'Try modifying your search criteria.'
              : 'Add your first drive to start accepting student applications.'
          }
          action={
            !search && (
              <Link to="/recruiter/drives/new">
                <Button variant="primary">Create Drive</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Drive & Company',
                render: (d) => (
                  <div>
                    <Link
                      to={`/recruiter/drives/${d.id}`}
                      className="font-serif font-bold text-sm text-[var(--text-primary)] hover:text-[#0F7B5F] dark:hover:text-[#D9B36C] transition-colors"
                    >
                      {d.title}
                    </Link>
                    <span className="block text-xs font-mono text-[var(--text-muted)]">
                      {d.company?.name || 'Partner Company'}
                    </span>
                  </div>
                ),
              },
              {
                key: 'stage',
                label: 'Stage',
                render: (d) => (
                  <Badge variant={STAGE_VARIANT[d.status] ?? 'neutral'}>{d.status}</Badge>
                ),
              },
              {
                key: 'applied',
                label: 'Applied',
                render: (d) => (
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {d.counts?.applied ?? 0}
                  </span>
                ),
              },
              {
                key: 'shortlisted',
                label: 'Shortlisted',
                render: (d) => (
                  <span className="font-mono text-[var(--text-secondary)]">
                    {d.counts?.shortlisted ?? 0}
                  </span>
                ),
              },
              {
                key: 'deadline',
                label: 'Application Deadline',
                render: (d) => (
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {formatDate(d.application_deadline).split(',')[0]}
                  </span>
                ),
              },
              {
                key: 'action',
                label: '',
                render: (d) => (
                  <Link
                    to={`/recruiter/drives/${d.id}`}
                    className="text-xs font-mono font-semibold text-[#0F7B5F] dark:text-[#D9B36C] hover:underline"
                  >
                    Open Workspace →
                  </Link>
                ),
              },
            ]}
            rows={filteredDrives}
          />
        </div>
      )}
    </div>
  );
}
