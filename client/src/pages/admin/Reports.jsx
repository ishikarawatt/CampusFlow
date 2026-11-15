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
  const [branchRows, setBranchRows] = useState([]);
  const [companyRows, setCompanyRows] = useState([]);
  const [packageRows, setPackageRows] = useState([]);

  // Load all extra reports in parallel
  useEffect(() => {
    (async () => {
      try {
        const [{ data: br }, { data: co }, { data: pk }] = await Promise.all([
          reportsApi.branches(),
          reportsApi.companies(),
          reportsApi.packages(),
        ]);
        setBranchRows(br ?? []);
        setCompanyRows(co ?? []);
        setPackageRows(pk ?? []);
      } catch (err) {
        toast(errMsg(err, 'Could not load extra reports.'), 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Aggregate totals for ledger strip
  const totalStudents = branchRows.reduce((a, r) => a + Number(r.students || 0), 0);
  const totalApplied = branchRows.reduce((a, r) => a + Number(r.applied || 0), 0);
  const totalPlaced = branchRows.reduce((a, r) => a + Number(r.placed || 0), 0);

  // Simple SVG bar chart for branch placement percentages
  const BranchChart = () => (
    <svg width="100%" height={branchRows.length * 30} style={{ overflow: 'visible' }}>
      {branchRows.map((b, i) => (
        <g key={b.branch} transform={`translate(0,${i * 30})`}>.
          <text x={0} y={15} fontSize={12} fill="var(--text-primary)">{b.branch}</text>
          <rect x={120} y={5} height={20} width={b.placement_pct * 3} fill="#4caf50" />
          <text x={125 + b.placement_pct * 3} y={20} fontSize={12} fill="var(--text-muted)">{b.placement_pct}%</text>
        </g>
      ))}
    </svg>
  );

  // CSV export handler
  const downloadCsv = async (method) => {
    try {
      const res = await method();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const disposition = res.headers['content-disposition'];
      const filename = disposition?.split('filename=')[1]?.replace(/"/g, '') || 'export.csv';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast(errMsg(err, 'CSV download failed.'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <Skeleton className="h-64 w-full rounded-[10px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Reports"
        subtitle="Hiring funnel drop‑off analytics and new OS‑Lab views."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Reports' }]}
      />

      {/* Ledger strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Students" value={totalStudents} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Applied" value={totalApplied} icon={<FileBarChart className="w-5 h-5" />} />
        <StatCard label="Placed" value={totalPlaced} icon={<Award className="w-5 h-5" />} />
      </div>

      {/* Branch placement chart */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-4">
        <h3 className="font-serif font-bold text-base text-[var(--text-primary)] mb-2">Branch Placement %</h3>
        <BranchChart />
        <button className="mt-2 btn-primary" onClick={() => downloadCsv(reportsApi.branchesCsv)}>Export CSV</button>
      </div>

      {/* Companies funnel table */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">Company Funnel</h3>
          <button className="btn-primary" onClick={() => downloadCsv(reportsApi.companiesCsv)}>Export CSV</button>
        </div>
        <DataTable
          columns={[
            { key: 'name', label: 'Company' },
            { key: 'drives', label: 'Drives' },
            { key: 'applicants', label: 'Applicants' },
            { key: 'shortlisted', label: 'Shortlisted' },
            { key: 'selected', label: 'Selected' },
            { key: 'offers', label: 'Offers' },
          ]}
          rows={companyRows}
        />
      </div>

      {/* Package stats table */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">Package Statistics</h3>
          <button className="btn-primary" onClick={() => downloadCsv(reportsApi.packagesCsv)}>Export CSV</button>
        </div>
        <DataTable
          columns={[
            { key: 'drive_id', label: 'Drive ID' },
            { key: 'title', label: 'Drive Title' },
            { key: 'min_package', label: 'Min LPA' },
            { key: 'max_package', label: 'Max LPA' },
            { key: 'avg_package', label: 'Avg LPA' },
          ]}
          rows={packageRows}
        />
      </div>
    </div>
  );
}
