// Recruiter drive wizard — the whole drive setup in one guided flow:
//   1. Drive details (company, eligibility, dates)
//   2. Test questions (the aptitude test students will take)
//   3. Interview setup (panels, cutoff, shortlist cap)
//   4. Review & publish

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { drives as drivesApi, companies as companiesApi, errMsg } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Stepper from '../../components/Stepper.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import { PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';

const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'CE', 'EE'];

const STEPS = [
  { key: 'details', label: 'Drive Details' },
  { key: 'questions', label: 'Test Questions' },
  { key: 'interview', label: 'Interview Setup' },
  { key: 'review', label: 'Review & Publish' },
];

function emptyQuestion() {
  return { text: '', options: ['', '', '', ''], correct_index: null, marks: 1 };
}

export default function NewDriveWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', website: '', sector: '' });

  const [form, setForm] = useState({
    company_id: '',
    title: '',
    description: '',
    min_cgpa: '7.0',
    allowed_branches: ['CSE', 'IT'],
    max_backlogs: '0',
    graduation_year: '2027',
    application_deadline: '',
    test_date: '',
    interview_date: '',
  });

  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [interview, setInterview] = useState({
    num_interviewers: 2,
    min_test_score: 50,
    max_shortlist: 20,
    test_duration_min: 60,
    interview_duration_min: 20,
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    companiesApi
      .list()
      .then(({ data }) => {
        setCompanies(data ?? []);
        if ((data ?? []).length && !form.company_id) {
          setForm((f) => ({ ...f, company_id: String(data[0].id) }));
        }
      })
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setI = (k, v) => setInterview((f) => ({ ...f, [k]: v }));

  const toggleBranch = (b) => {
    setForm((f) => ({
      ...f,
      allowed_branches: f.allowed_branches.includes(b)
        ? f.allowed_branches.filter((x) => x !== b)
        : [...f.allowed_branches, b],
    }));
  };

  const addCompany = async () => {
    if (!newCompany.name.trim()) {
      toast('Company name is required.', 'error');
      return;
    }
    try {
      const { data } = await companiesApi.create(newCompany);
      const c = data.company ?? data;
      setCompanies((list) => [...list, c]);
      setForm((f) => ({ ...f, company_id: String(c.id) }));
      setShowNewCompany(false);
      setNewCompany({ name: '', website: '', sector: '' });
      toast('Company added successfully.', 'success');
    } catch (err) {
      toast(errMsg(err, 'Could not add the company.'), 'error');
    }
  };

  const setQ = (i, patch) =>
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const setOpt = (i, oi, v) =>
    setQuestions((qs) =>
      qs.map((q, j) => {
        if (j !== i) return q;
        const options = q.options.map((o, k) => (k === oi ? v : o));
        return { ...q, options };
      })
    );

  const validateStep = () => {
    if (step === 0) {
      if (!form.company_id) return 'Pick or add a recruiting company.';
      if (!form.title.trim()) return 'Give the placement drive a title.';
      if (!form.allowed_branches.length) return 'Select at least one eligible branch.';
      if (!form.application_deadline) return 'Set an application deadline.';
      if (!form.test_date) return 'Pick a test date for automated scheduling.';
      return null;
    }
    if (step === 1) {
      if (!questions.length) return 'Add at least one test question.';
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.text.trim()) return `Question ${i + 1}: write the question text.`;
        if (q.options.some((o) => !o.trim())) return `Question ${i + 1}: fill in all four options.`;
        if (q.correct_index == null) return `Question ${i + 1}: select the correct option radio.`;
      }
      return null;
    }
    return null;
  };

  const next = () => {
    const problem = validateStep();
    if (problem) {
      toast(problem, 'error');
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo(0, 0);
  };
  const back = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo(0, 0);
  };

  const loadPreview = async () => {
    try {
      const { data } = await drivesApi.previewEligibility({
        min_cgpa: Number(form.min_cgpa),
        allowed_branches: form.allowed_branches,
        max_backlogs: Number(form.max_backlogs),
        graduation_year: Number(form.graduation_year),
      });
      setPreview(data);
    } catch (_) {}
  };

  useEffect(() => {
    if (step === 3) loadPreview();
  }, [step]);

  const publish = async () => {
    setPublishing(true);
    try {
      const { data } = await drivesApi.create({
        company_id: Number(form.company_id),
        title: form.title.trim(),
        description: form.description.trim() || null,
        min_cgpa: Number(form.min_cgpa),
        allowed_branches: form.allowed_branches,
        max_backlogs: Number(form.max_backlogs),
        graduation_year: Number(form.graduation_year),
        application_deadline: form.application_deadline.replace('T', ' ') + ':00',
        test_date: form.test_date,
        interview_date: form.interview_date || null,
        test_duration_min: Number(interview.test_duration_min),
        interview_duration_min: Number(interview.interview_duration_min),
        num_interviewers: Number(interview.num_interviewers),
        min_test_score: Number(interview.min_test_score),
        max_shortlist: Number(interview.max_shortlist),
      });
      const driveId = data.drive.id;
      await drivesApi.saveQuestions(
        driveId,
        questions.map((q) => ({
          text: q.text.trim(),
          options: q.options.map((o) => o.trim()),
          correct_index: q.correct_index,
          marks: Number(q.marks) || 1,
        }))
      );
      toast('Placement drive published successfully.', 'success');
      navigate(`/recruiter/drives/${driveId}`);
    } catch (err) {
      toast(errMsg(err, 'Could not publish the drive.'), 'error');
    } finally {
      setPublishing(false);
    }
  };

  const stepperSteps = STEPS.map((s, i) => ({
    ...s,
    state: i < step ? 'done' : i === step ? 'current' : 'todo',
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Add Recruitment Drive"
        subtitle="Complete the guided setup to define eligibility, question paper, and interview slots."
        breadcrumbs={[
          { label: 'Recruiter', to: '/recruiter' },
          { label: 'Drives', to: '/recruiter/drives' },
          { label: 'Add Drive' },
        ]}
      />

      {/* Stepper Header */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5 shadow-subtle">
        <Stepper steps={stepperSteps} />
      </div>

      {/* STEP 1: Details */}
      {step === 0 && (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-5">
          <div className="border-b border-[var(--border-color)] pb-3">
            <h2 className="text-lg font-serif font-bold text-[var(--text-primary)]">Drive Specifications</h2>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
              Set role title, hiring company, and academic eligibility requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1.5">
                Recruiting Company
              </label>
              <div className="flex gap-2">
                <select
                  value={form.company_id}
                  onChange={(e) => set('company_id', e.target.value)}
                  className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-accent)]"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowNewCompany((v) => !v)}
                >
                  + New
                </Button>
              </div>

              {showNewCompany && (
                <div className="mt-3 p-4 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-[6px] space-y-3">
                  <input
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="Company name"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={newCompany.website}
                      onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                      placeholder="Website URL"
                      className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                    />
                    <input
                      value={newCompany.sector}
                      onChange={(e) => setNewCompany({ ...newCompany, sector: e.target.value })}
                      placeholder="Industry sector"
                      className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <Button variant="primary" size="sm" onClick={addCompany}>
                    Save Company
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1.5">
                Drive / Role Title
              </label>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Software Engineer 2027"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1.5">
              Role Description & CTC
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="Responsibilities, required technical competencies, package details..."
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1.5">
              Eligible Branches
            </label>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map((b) => {
                const isSelected = form.allowed_branches.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBranch(b)}
                    className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-semibold border transition-colors ${
                      isSelected
                        ? 'border-[#D9B36C] bg-[#D9B36C] text-[#0B1F1A]'
                        : 'border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Min CGPA
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={form.min_cgpa}
                onChange={(e) => set('min_cgpa', e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Max Backlogs
              </label>
              <input
                type="number"
                min="0"
                value={form.max_backlogs}
                onChange={(e) => set('max_backlogs', e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Graduation Year
              </label>
              <input
                type="number"
                value={form.graduation_year}
                onChange={(e) => set('graduation_year', e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Apply Deadline
              </label>
              <input
                type="datetime-local"
                value={form.application_deadline}
                onChange={(e) => set('application_deadline', e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Test Date
              </label>
              <input
                type="date"
                value={form.test_date}
                onChange={(e) => set('test_date', e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Interview Date (Optional)
              </label>
              <input
                type="date"
                value={form.interview_date}
                onChange={(e) => set('interview_date', e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Questions */}
      {step === 1 && (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-[var(--text-primary)]">Test Questions</h2>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                Define the multiple-choice questions for the timed aptitude assessment.
              </p>
            </div>
            <Badge variant="info">{questions.length} Question(s)</Badge>
          </div>

          {questions.map((q, i) => (
            <div
              key={i}
              className="border border-[var(--border-color)] rounded-[8px] p-5 bg-[var(--bg-subtle)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                  Question {i + 1}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-mono text-[var(--text-muted)]">Marks:</label>
                  <input
                    type="number"
                    min="1"
                    value={q.marks}
                    onChange={(e) => setQ(i, { marks: e.target.value })}
                    className="w-16 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[4px] px-2 py-1 text-xs text-[var(--text-primary)] font-mono"
                  />
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}
                      className="p-1 text-[#9E3524] hover:bg-[#9E3524]/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <input
                value={q.text}
                onChange={(e) => setQ(i, { text: e.target.value })}
                placeholder="Write question description..."
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-accent)]"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-center gap-2.5 rounded-[6px] border px-3 py-2 cursor-pointer transition-colors ${
                      q.correct_index === oi
                        ? 'border-[#0F7B5F] bg-[#0F7B5F]/10 dark:border-[#D9B36C] dark:bg-[#D9B36C]/10'
                        : 'border-[var(--border-color)] bg-[var(--bg-surface)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${i}`}
                      checked={q.correct_index === oi}
                      onChange={() => setQ(i, { correct_index: oi })}
                      className="accent-[#0F7B5F] dark:accent-[#D9B36C]"
                    />
                    <input
                      value={opt}
                      onChange={(e) => setOpt(i, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 bg-transparent text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                  </label>
                ))}
              </div>
              <p className="text-[11px] font-mono text-[var(--text-muted)]">
                Select the radio button next to the correct answer.
              </p>
            </div>
          ))}

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            Add Question
          </Button>
        </div>
      )}

      {/* STEP 3: Interview Setup */}
      {step === 2 && (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-5">
          <div className="border-b border-[var(--border-color)] pb-3">
            <h2 className="text-lg font-serif font-bold text-[var(--text-primary)]">Interview Parameters</h2>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
              The automated scheduler uses these variables to generate non-overlapping candidate slots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-2">
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)]">
                Interview Panels
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setI('num_interviewers', Math.max(1, Number(interview.num_interviewers) - 1))}
                  className="w-8 h-8 rounded border border-[var(--border-color)] text-sm font-bold text-[var(--text-primary)]"
                >
                  −
                </button>
                <span className="font-mono font-bold text-lg text-[var(--text-primary)] w-8 text-center">
                  {interview.num_interviewers}
                </span>
                <button
                  type="button"
                  onClick={() => setI('num_interviewers', Math.min(10, Number(interview.num_interviewers) + 1))}
                  className="w-8 h-8 rounded border border-[var(--border-color)] text-sm font-bold text-[var(--text-primary)]"
                >
                  +
                </button>
              </div>
              <p className="text-[11px] font-mono text-[var(--text-muted)]">Parallel interview panels.</p>
            </div>

            <div className="p-4 rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-2">
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)]">
                Min Cutoff (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={interview.min_test_score}
                onChange={(e) => setI('min_test_score', e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs font-mono text-[var(--text-primary)]"
              />
              <p className="text-[11px] font-mono text-[var(--text-muted)]">Minimum test percentage.</p>
            </div>

            <div className="p-4 rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-2">
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)]">
                Shortlist Cap
              </label>
              <input
                type="number"
                min="1"
                value={interview.max_shortlist}
                onChange={(e) => setI('max_shortlist', e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs font-mono text-[var(--text-primary)]"
              />
              <p className="text-[11px] font-mono text-[var(--text-muted)]">Max shortlisted candidates.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Test Duration (Minutes)
              </label>
              <input
                type="number"
                min="10"
                value={interview.test_duration_min}
                onChange={(e) => setI('test_duration_min', e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Interview Length (Minutes)
              </label>
              <input
                type="number"
                min="5"
                value={interview.interview_duration_min}
                onChange={(e) => setI('interview_duration_min', e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Review */}
      {step === 3 && (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-5">
          <div className="border-b border-[var(--border-color)] pb-3">
            <h2 className="text-lg font-serif font-bold text-[var(--text-primary)]">Review & Confirmation</h2>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
              Verify drive details before publishing to eligible students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Role Title</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{form.title}</p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Academic Criteria</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                CGPA ≥ {form.min_cgpa} · {form.allowed_branches.join(', ')}
              </p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Test Assessment</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                {questions.length} questions · {interview.test_duration_min} min
              </p>
            </div>
            <div className="p-4 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <span className="text-[var(--text-muted)] uppercase">Interview Capacity</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                {interview.num_interviewers} panels · Cutoff {interview.min_test_score}%
              </p>
            </div>
          </div>

          {preview && (
            <div className="p-4 rounded-[6px] border border-[var(--border-gold)] bg-[var(--brand-accent)]/10 text-xs font-mono text-[var(--text-primary)]">
              <span className="font-bold text-sm">{preview.count}</span> students in the database currently match these criteria.
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" onClick={back} disabled={step === 0}>
          ← Back
        </Button>
        {step < 3 ? (
          <Button variant="primary" onClick={next}>
            Continue →
          </Button>
        ) : (
          <Button variant="primary" onClick={publish} loading={publishing}>
            Publish Placement Drive 🚀
          </Button>
        )}
      </div>
    </div>
  );
}
