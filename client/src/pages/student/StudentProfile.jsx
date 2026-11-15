// Student Profile — real backend wiring, completeness meter, editable skills/projects/certs, resume management.

import React, { useEffect, useState, useRef } from 'react';
import { student, errMsg } from '../../api';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Skeleton from '../../components/Skeleton';
import {
  UserCircle,
  Mail,
  GraduationCap,
  Hash,
  BookOpen,
  Award,
  Phone,
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function StudentProfile() {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [profile, setProfile] = useState(null);

  // Editable form fields
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // New item draft states
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', desc: '', link: '' });

  const [showAddCert, setShowAddCert] = useState(false);
  const [newCert, setNewCert] = useState({ name: '', issuer: '', year: '' });

  // Dialog state
  const [deleteResumeOpen, setDeleteResumeOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await student.getProfile();
      const p = res.data?.profile || res.data?.student || res.data;
      setProfile(p);
      setPhone(p.phone || '');
      setSkills(Array.isArray(p.skills) ? p.skills : []);
      setProjects(Array.isArray(p.projects) ? p.projects : []);
      setCertifications(Array.isArray(p.certifications) ? p.certifications : []);
    } catch (err) {
      toast(errMsg(err, 'Failed to load profile.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // -------------------------------------------------------------------------
  // Handlers: Save Editable Profile
  // -------------------------------------------------------------------------
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        phone: phone.trim() || null,
        skills,
        projects,
        certifications,
      };
      const res = await student.updateProfile(payload);
      const updated = res.data?.profile || res.data;
      setProfile((prev) => ({ ...prev, ...updated }));
      toast('Profile updated successfully.', 'success');
    } catch (err) {
      toast(errMsg(err, 'Failed to save profile changes.'), 'danger');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handlers: Skills Tag Input
  // -------------------------------------------------------------------------
  const handleAddSkill = () => {
    const val = skillInput.trim();
    if (!val) return;
    if (skills.length >= 30) {
      toast('Maximum 30 skills allowed.', 'warning');
      return;
    }
    if (skills.includes(val)) {
      toast('Skill already added.', 'warning');
      return;
    }
    setSkills([...skills, val]);
    setSkillInput('');
  };

  const handleRemoveSkill = (idx) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  // -------------------------------------------------------------------------
  // Handlers: Projects
  // -------------------------------------------------------------------------
  const handleAddProject = () => {
    if (!newProject.title.trim()) {
      toast('Project title is required.', 'warning');
      return;
    }
    if (projects.length >= 10) {
      toast('Maximum 10 projects allowed.', 'warning');
      return;
    }
    setProjects([...projects, { ...newProject, title: newProject.title.trim() }]);
    setNewProject({ title: '', desc: '', link: '' });
    setShowAddProject(false);
  };

  const handleRemoveProject = (idx) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };

  // -------------------------------------------------------------------------
  // Handlers: Certifications
  // -------------------------------------------------------------------------
  const handleAddCert = () => {
    if (!newCert.name.trim() || !newCert.issuer.trim()) {
      toast('Certification name and issuer are required.', 'warning');
      return;
    }
    if (certifications.length >= 10) {
      toast('Maximum 10 certifications allowed.', 'warning');
      return;
    }
    setCertifications([
      ...certifications,
      {
        name: newCert.name.trim(),
        issuer: newCert.issuer.trim(),
        year: newCert.year ? Number(newCert.year) : undefined,
      },
    ]);
    setNewCert({ name: '', issuer: '', year: '' });
    setShowAddCert(false);
  };

  const handleRemoveCert = (idx) => {
    setCertifications(certifications.filter((_, i) => i !== idx));
  };

  // -------------------------------------------------------------------------
  // Handlers: Resume Upload / Download / Delete
  // -------------------------------------------------------------------------
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast('Only PDF documents are allowed.', 'danger');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('Resume file size must not exceed 5MB.', 'danger');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      setUploadingResume(true);
      await student.uploadResume(formData);
      toast('Resume uploaded successfully.', 'success');
      await fetchProfile();
    } catch (err) {
      toast(errMsg(err, 'Failed to upload resume. Please ensure it is a valid PDF document.'), 'danger');
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadResume = async () => {
    try {
      const res = await student.downloadResume();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = profile?.resume_original_name || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast(errMsg(err, 'Failed to download resume file.'), 'danger');
    }
  };

  const handleDeleteResume = async () => {
    try {
      await student.deleteResume();
      toast('Resume deleted.', 'success');
      await fetchProfile();
    } catch (err) {
      toast(errMsg(err, 'Failed to delete resume.'), 'danger');
    } finally {
      setDeleteResumeOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton variant="heading" />
        <Skeleton variant="card" />
        <Skeleton variant="table" />
      </div>
    );
  }

  const completeness = profile?.profile_completeness ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Profile & Resume"
        subtitle="Manage your personal details, technical portfolio, and uploaded resume for campus placements."
        breadcrumbs={[
          { label: 'Student', to: '/student' },
          { label: 'Profile' },
        ]}
      />

      {/* Profile Completeness Meter */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-serif font-bold text-[var(--text-primary)]">Profile Completeness</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Recruiters view profiles with 80%+ completeness first during shortlisting.
            </p>
          </div>
          <span className="text-2xl font-bold text-[#D9B36C] font-mono">{completeness}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#D9B36C] transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 100 && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-3">
            <AlertCircle className="w-4 h-4 text-[#D9B36C] shrink-0" />
            <span>
              Tip: Add your contact phone, at least one skill, project, certification, and resume to hit 100%.
            </span>
          </div>
        )}
      </div>

      {/* Resume Card */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
          <div>
            <h3 className="text-base font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#D9B36C]" />
              Placement Resume
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Verified PDF resume accessed by recruiters reviewing your applications.
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />
        </div>

        {profile?.has_resume ? (
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[8px] bg-[var(--bg-subtle)] border border-[var(--border-color)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[6px] bg-[#0F7B5F]/15 border border-[#0F7B5F]/30 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#0F7B5F]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--text-primary)] truncate font-mono">
                  {profile.resume_original_name || 'resume.pdf'}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  Uploaded {profile.resume_uploaded_at ? new Date(profile.resume_uploaded_at).toLocaleDateString() : 'recently'} · PDF document (≤5MB)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadResume}
                className="flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingResume}
                className="flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${uploadingResume ? 'animate-spin' : ''}`} />
                Replace
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteResumeOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 text-center p-8 border-2 border-dashed border-[var(--border-color)] rounded-[8px] bg-[var(--bg-subtle)]">
            <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-70" />
            <h4 className="text-sm font-bold text-[var(--text-primary)]">No Resume Uploaded</h4>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto mb-4">
              Upload your resume in PDF format (maximum 5MB). Recruiters require a resume for interview scheduling.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingResume}
              className="inline-flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploadingResume ? 'Uploading...' : 'Upload PDF Resume'}
            </Button>
          </div>
        )}
      </div>

      {/* Academic Record (Institutional / Read-Only) */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <h3 className="text-sm font-serif font-bold text-[var(--text-primary)]">Institutional Academic Record</h3>
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Verified by Placement Cell
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-color)] border-b border-[var(--border-color)]">
          <div className="p-4 flex items-center gap-3">
            <UserCircle className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)]">Full Name</div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{profile?.name}</div>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Mail className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)]">Email Address</div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{profile?.email}</div>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Hash className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)]">Roll Number</div>
              <div className="text-sm font-medium text-[var(--text-primary)] font-mono">{profile?.roll_no}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-color)]">
          <div className="p-4 flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)]">Branch</div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{profile?.branch}</div>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Award className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)]">CGPA</div>
              <div className="text-sm font-bold text-[var(--text-primary)] font-mono">{profile?.cgpa?.toFixed(2)}</div>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)]">Active Backlogs</div>
              <div className="text-sm font-medium text-[var(--text-primary)] font-mono">{profile?.backlogs ?? 0}</div>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <GraduationCap className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)]">Graduation Year</div>
              <div className="text-sm font-medium text-[var(--text-primary)] font-mono">{profile?.graduation_year}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Student Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Contact Information */}
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle">
          <h3 className="text-sm font-serif font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#D9B36C]" />
            Contact Information
          </h3>
          <div className="max-w-md">
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-mono">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-app)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
              Used by recruiters to contact you for interview coordinates.
            </p>
          </div>
        </div>

        {/* Technical Skills */}
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle">
          <h3 className="text-sm font-serif font-bold text-[var(--text-primary)] mb-1">
            Technical Skills ({skills.length}/30)
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Add key technologies, frameworks, languages and tools you are proficient in.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#0F7B5F]/15 text-[#0F7B5F] border border-[#0F7B5F]/30"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(idx)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {skills.length === 0 && (
              <span className="text-xs text-[var(--text-muted)] italic">No skills added yet.</span>
            )}
          </div>

          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="e.g. React, Python, Docker..."
              maxLength={40}
              className="flex-1 px-3.5 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-app)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleAddSkill}>
              Add
            </Button>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-serif font-bold text-[var(--text-primary)]">
                Key Projects ({projects.length}/10)
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Highlight hands-on engineering projects and open source contributions.
              </p>
            </div>
            {!showAddProject && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowAddProject(true)}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Project
              </Button>
            )}
          </div>

          {showAddProject && (
            <div className="p-4 rounded-[8px] bg-[var(--bg-subtle)] border border-[var(--border-color)] mb-4 space-y-3">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase font-mono">New Project</h4>
              <div>
                <input
                  type="text"
                  placeholder="Project Title (e.g. Distributed Key-Value Store)"
                  maxLength={100}
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
                />
              </div>
              <div>
                <textarea
                  placeholder="Description of architecture, technologies and impact..."
                  maxLength={500}
                  rows={2}
                  value={newProject.desc}
                  onChange={(e) => setNewProject({ ...newProject, desc: e.target.value })}
                  className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
                />
              </div>
              <div>
                <input
                  type="url"
                  placeholder="Link URL (GitHub, live demo, or docs)"
                  maxLength={255}
                  value={newProject.link}
                  onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                  className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="primary" size="sm" onClick={handleAddProject}>
                  Save Project
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowAddProject(false);
                    setNewProject({ title: '', desc: '', link: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-4 rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-surface)] flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-primary)]">{proj.title}</span>
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#0F7B5F] hover:underline flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </a>
                    )}
                  </div>
                  {proj.desc && <p className="text-xs text-[var(--text-muted)] mt-1">{proj.desc}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProject(idx)}
                  className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {projects.length === 0 && !showAddProject && (
              <p className="text-xs text-[var(--text-muted)] italic">No projects listed yet.</p>
            )}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-serif font-bold text-[var(--text-primary)]">
                Certifications ({certifications.length}/10)
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Industry certifications, badges, and professional courses.
              </p>
            </div>
            {!showAddCert && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowAddCert(true)}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Certification
              </Button>
            )}
          </div>

          {showAddCert && (
            <div className="p-4 rounded-[8px] bg-[var(--bg-subtle)] border border-[var(--border-color)] mb-4 space-y-3">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase font-mono">New Certification</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Certification Name (e.g. AWS Certified Solutions Architect)"
                  maxLength={100}
                  value={newCert.name}
                  onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                  className="px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
                />
                <input
                  type="text"
                  placeholder="Issuer (e.g. Amazon Web Services, CNCF)"
                  maxLength={100}
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                  className="px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
                />
              </div>
              <div className="max-w-xs">
                <input
                  type="number"
                  placeholder="Year of Issue (e.g. 2026)"
                  min={2000}
                  max={2030}
                  value={newCert.year}
                  onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
                  className="w-full px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="primary" size="sm" onClick={handleAddCert}>
                  Save Certification
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowAddCert(false);
                    setNewCert({ name: '', issuer: '', year: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {certifications.map((cert, idx) => (
              <div
                key={idx}
                className="p-4 rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">{cert.name}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    Issued by <span className="font-semibold text-[var(--text-primary)]">{cert.issuer}</span>
                    {cert.year ? ` · ${cert.year}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCert(idx)}
                  className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {certifications.length === 0 && !showAddCert && (
              <p className="text-xs text-[var(--text-muted)] italic">No certifications listed yet.</p>
            )}
          </div>
        </div>

        {/* Form Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={saving}
            className="flex items-center gap-2 min-w-[140px] justify-center"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Confirm Delete Resume Dialog */}
      <ConfirmDialog
        open={deleteResumeOpen}
        title="Delete Resume?"
        message="Are you sure you want to delete your uploaded resume? Recruiters will not be able to view it until you upload a replacement."
        confirmLabel="Delete Resume"
        variant="danger"
        onConfirm={handleDeleteResume}
        onCancel={() => setDeleteResumeOpen(false)}
      />
    </div>
  );
}
