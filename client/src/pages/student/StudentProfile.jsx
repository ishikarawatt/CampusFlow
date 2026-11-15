// Student Profile — completeness meter, academic record, resume card.

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth.jsx';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import { UserCircle, Mail, GraduationCap, Hash, BookOpen, Award } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Profile completeness calculation
  const fields = [
    { label: 'Name', value: user?.name, icon: UserCircle },
    { label: 'Email', value: user?.email, icon: Mail },
    { label: 'Roll No', value: user?.roll_no, icon: Hash },
    { label: 'Branch', value: user?.branch, icon: BookOpen },
    { label: 'CGPA', value: user?.cgpa, icon: Award },
    { label: 'Graduation Year', value: user?.graduation_year, icon: GraduationCap },
  ];

  const filled = fields.filter((f) => f.value != null && f.value !== '').length;
  const completeness = Math.round((filled / fields.length) * 100);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Profile"
        subtitle="Your academic details used for drive eligibility checks."
        breadcrumbs={[
          { label: 'Student', to: '/student' },
          { label: 'Profile' },
        ]}
      />

      {/* Completeness Meter */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-serif font-bold text-[var(--text-primary)]">Profile Completeness</h3>
          <span className="text-2xl font-bold text-[#D9B36C] font-mono">{completeness}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#D9B36C] transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 100 && (
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Complete your profile to improve drive eligibility matching.
          </p>
        )}
      </div>

      {/* Profile Details */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-serif font-bold text-[var(--text-primary)]">Academic Record</h3>
        </div>
        <div className="divide-y divide-[var(--border-color)]">
          {fields.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="px-6 py-4 flex items-center gap-4">
                <Icon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <div className="flex-1">
                  <div className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-muted)]">{f.label}</div>
                  <div className="text-sm font-medium text-[var(--text-primary)] mt-0.5">
                    {f.value != null && f.value !== '' ? String(f.value) : (
                      <span className="text-[var(--text-muted)] italic">Not set</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resume placeholder */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle text-center">
        <div className="text-4xl mb-3">📄</div>
        <h3 className="text-sm font-serif font-bold text-[var(--text-primary)]">Resume</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
          Upload your resume so recruiters can see it when reviewing applications.
        </p>
        <Button variant="secondary" size="sm" onClick={() => toast('Resume upload coming soon.', 'info')}>
          Upload Resume
        </Button>
      </div>
    </div>
  );
}

