// Recruiter Company Profile — Company overview, contact info, edit company profile modal, and active recruitment drives.

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth.jsx';
import { recruiter as recruiterApi, drives as drivesApi, errMsg } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Button from '../../components/Button.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import Badge from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import {
  Building2,
  Globe,
  Mail,
  Briefcase,
  PlusCircle,
  Edit3,
  MapPin,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecruiterCompany() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [drives, setDrives] = useState([]);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    description: '',
    website: '',
    location: '',
    industry: '',
    hr_contact_email: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [{ data: cData }, { data: dList }] = await Promise.all([
        recruiterApi.getCompany().catch(() => ({ data: { company: null } })),
        drivesApi.list().catch(() => ({ data: [] })),
      ]);

      const c = cData?.company || cData;
      setCompany(c);
      if (c) {
        setEditForm({
          description: c.description || '',
          website: c.website || '',
          location: c.location || '',
          industry: c.industry || c.sector || '',
          hr_contact_email: c.hr_contact_email || '',
        });
      }
      setDrives(dList ?? []);
    } catch (err) {
      toast(errMsg(err, 'Could not load company details.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveCompany = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await recruiterApi.updateCompany(editForm);
      const updated = res.data?.company || res.data;
      setCompany(updated);
      toast('Company profile updated successfully.', 'success');
      setIsEditOpen(false);
    } catch (err) {
      toast(errMsg(err, 'Failed to update company profile.'), 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <Skeleton className="h-48 w-full rounded-[10px]" />
        <Skeleton className="h-48 w-full rounded-[10px]" />
      </div>
    );
  }

  const comp = company || {
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
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit3 className="w-4 h-4" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit Profile
            </Button>
            <Link to="/recruiter/drives/new">
              <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                Add Drive
              </Button>
            </Link>
          </div>
        }
      />

      {/* Main Corporate Card */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D9B36C]" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[10px] bg-[#0F7B5F]/15 border border-[#0F7B5F]/30 flex items-center justify-center text-[#0F7B5F] shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
                  {comp.name}
                </h2>
                <Badge variant="success">Verified Partner</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
                {comp.industry || comp.sector || 'Industry Partner'}
                {comp.location ? ` · ${comp.location}` : ''}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Info
          </Button>
        </div>

        {comp.description && (
          <p className="text-sm text-[var(--text-secondary)] mt-4 pt-4 border-t border-[var(--border-color)] leading-relaxed">
            {comp.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--border-color)] text-xs font-mono">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Globe className="w-4 h-4 text-[#D9B36C] shrink-0" />
            <span className="truncate">{comp.website || 'No website set'}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Mail className="w-4 h-4 text-[#D9B36C] shrink-0" />
            <span className="truncate">{comp.hr_contact_email || user?.email || 'contact@campusflow.local'}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <MapPin className="w-4 h-4 text-[#D9B36C] shrink-0" />
            <span className="truncate">{comp.location || 'Headquarters'}</span>
          </div>
        </div>
      </div>

      {/* Quick Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Drives" value={drives.length} icon={<Briefcase className="w-5 h-5" />} />
        <StatCard label="Active Drives" value={activeDrives.length} icon={<Building2 className="w-5 h-5" />} />
        <StatCard
          label="Total Applicants"
          value={drives.reduce((acc, d) => acc + (d.counts?.applied || 0), 0)}
          icon={<Briefcase className="w-5 h-5" />}
        />
      </div>

      {/* Active Drives */}
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

      {/* Edit Company Profile Modal */}
      <Modal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Company Profile"
      >
        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono">
              Company Overview / Description
            </label>
            <textarea
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="About our mission, core platforms, and engineering culture..."
              className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono">
                Website
              </label>
              <input
                type="text"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                placeholder="https://example.com"
                maxLength={255}
                className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono">
                Location
              </label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="e.g. Bangalore, KA"
                maxLength={120}
                className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono">
                Industry / Sector
              </label>
              <input
                type="text"
                value={editForm.industry}
                onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                placeholder="e.g. Cloud Infrastructure"
                maxLength={80}
                className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono">
                HR Contact Email
              </label>
              <input
                type="email"
                value={editForm.hr_contact_email}
                onChange={(e) => setEditForm({ ...editForm, hr_contact_email: e.target.value })}
                placeholder="talent@example.com"
                maxLength={255}
                className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)] mt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
              className="flex items-center gap-1.5"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
