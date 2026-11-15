// Recruiter Company Profile — Company overview, contact info, and active recruitment drives.

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth.jsx';
import { companies as companiesApi, drives as drivesApi, errMsg } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Button from '../../components/Button.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import Badge from '../../components/Badge.jsx';
import { Building2, Globe, Mail, Briefcase, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecruiterCompany() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: cList }, { data: dList }] = await Promise.all([
          companiesApi.list().catch(() => ({ data: [] })),
          drivesApi.list().catch(() => ({ data: [] })),
        ]);
        setCompanies(cList ?? []);
        setDrives(dList ?? []);
      } catch (err) {
        toast(errMsg(err, 'Could not load company details.'), 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <Skeleton className="h-48 w-full rounded-[10px]" />
      </div>
    );
  }

  const primaryCompany = companies[0] || {
    name: user?.company_name || 'Organization',
    sector: 'Technology & Services',
    website: 'https://campusflow.local',
  };

  const activeDrives = drives.filter((d) => d.status !== 'closed');

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Company Profile"
        subtitle="Manage corporate identity, recruitment branches, and active placements."
        breadcrumbs={[
          { label: 'Recruiter', to: '/recruiter' },
          { label: 'Company' },
        ]}
        actions={
          <Link to="/recruiter/drives/new">
            <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
              Add Drive
            </Button>
          </Link>
        }
      />

      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D9B36C]" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-[10px] bg-[#0F7B5F]/15 border border-[#0F7B5F]/30 flex items-center justify-center text-[#0F7B5F] shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
                {primaryCompany.name}
              </h2>
              <Badge variant="success">Verified Partner</Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
              {primaryCompany.sector || 'Industry Partner'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[var(--border-color)] text-xs font-mono">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Globe className="w-4 h-4 text-[#D9B36C]" />
            <span>{primaryCompany.website || 'No website set'}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Mail className="w-4 h-4 text-[#D9B36C]" />
            <span>{user?.email || 'contact@campusflow.local'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Drives" value={drives.length} icon={<Briefcase className="w-5 h-5" />} />
        <StatCard label="Active Drives" value={activeDrives.length} icon={<Building2 className="w-5 h-5" />} />
        <StatCard
          label="Total Applicants"
          value={drives.reduce((acc, d) => acc + (d.counts?.applied || 0), 0)}
          icon={<Briefcase className="w-5 h-5" />}
        />
      </div>

      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle">
        <h3 className="text-lg font-serif font-bold text-[var(--text-primary)] mb-4">
          Active Placement Drives
        </h3>
        {activeDrives.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No active drives currently running.</p>
        ) : (
          <div className="space-y-3">
            {activeDrives.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between"
              >
                <div>
                  <Link
                    to={`/recruiter/drives/${d.id}`}
                    className="font-serif font-bold text-sm text-[var(--text-primary)] hover:text-[#D9B36C] transition-colors"
                  >
                    {d.title}
                  </Link>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                    {d.counts?.applied || 0} applicants · {d.counts?.shortlisted || 0} shortlisted
                  </p>
                </div>
                <Badge variant={d.status === 'open' ? 'success' : 'info'}>{d.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

