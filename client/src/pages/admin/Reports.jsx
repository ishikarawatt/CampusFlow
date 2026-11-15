// Admin Reports — Placement funnel analytics per drive (applied → shortlisted → selected).

import React, { useEffect, useState } from 'react';
import { reports as reportsApi, errMsg } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import StatCard from '../../components/StatCard.jsx';
import { FileBarChart, Users, CheckCircle2, Award } from 'lucide-react';

function Funnel({ applied, shortlisted, selected }) {
  const max = Math.max(applied, 1);
  const bars = [
    { label: 'Applied', n: applied, color: 'bg-[#D9B36C]' },
    { label: 'Shortlisted', n: shortlisted, color: 'bg-[#0F7B5F]' },
    { label: 'Selected', n: selected, color: 'bg-[#149674]' },
  ];

  return (
    <div className="space-y-1.5 min-w-[200px]">
      {bars.map(({ label, n, color }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[var(--text-muted)] w-20 shrink-0">
            {label}
          </span>
          <div className="flex-1 h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden border border-[var(--border-color)]">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${(n / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-[var(--text-primary)] w-8 text-right">
            {n}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await reportsApi.placement();
        setRows(data ?? []);
      } catch (err) {
        toast(errMsg(err, 'Could not load reports.'), 'error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <Skeleton className="h-64 w-full rounded-[10px]" />
      </div>
    );
  }

  const totalApplied = rows.reduce((acc, r) => acc + Number(r.applied || 0), 0);
  const totalShortlisted = rows.reduce((acc, r) => acc + Number(r.shortlisted || 0), 0);
  const totalSelected = rows.reduce((acc, r) => acc + Number(r.selected || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Reports"
        subtitle="Hiring funnel drop-off analytics and selection conversion metrics across campus drives."
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Reports' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Applications" value={totalApplied} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Total Shortlisted" value={totalShortlisted} icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatCard label="Placed Students" value={totalSelected} icon={<Award className="w-5 h-5" />} />
      </div>

      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)]">
          <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
            Drive Conversion Funnels
          </h3>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No report data available"
            message="Conversion metrics will compute as recruiters conduct assessments and record selections."
          />
        ) : (
          <DataTable
            columns={[
              {
                key: 'drive',
                label: 'Drive & Partner Company',
                render: (r) => (
                  <div>
                    <span className="font-serif font-bold text-sm text-[var(--text-primary)]">
                      {r.title}
                    </span>
                    <span className="block text-xs font-mono text-[var(--text-muted)]">
                      {r.company}
                    </span>
                  </div>
                ),
              },
              {
                key: 'funnel',
                label: 'Conversion Progression',
                render: (r) => (
                  <Funnel
                    applied={Number(r.applied || 0)}
                    shortlisted={Number(r.shortlisted || 0)}
                    selected={Number(r.selected || 0)}
                  />
                ),
              },
              {
                key: 'rate',
                label: 'Selection Rate',
                render: (r) => {
                  const applied = Number(r.applied || 0);
                  const selected = Number(r.selected || 0);
                  const pct = applied > 0 ? (selected / applied) * 100 : 0;
                  return (
                    <span className="font-mono font-bold text-xs text-[#0F7B5F] dark:text-[#D9B36C]">
                      {pct.toFixed(1)}%
                    </span>
                  );
                },
              },
            ]}
            rows={rows}
          />
        )}
      </div>
    </div>
  );
}
