// TestTaker — the student's aptitude test. One timed attempt, one question
// at a time, auto-submit on timeout, instant auto-graded result.
// Distraction-free full-screen mode + confirmation modal before submit.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { drives as drivesApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import Button from '../../components/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { StampBadge, AdmitCard, MarginNote } from '../../components/signature';
import { Maximize2, Minimize2, AlertTriangle, Clock, CheckCircle, FileText, CheckCircle2 } from 'lucide-react';

function mmss(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function TestTaker() {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState(null);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    drivesApi
      .getTest(driveId)
      .then(({ data }) => {
        setPaper(data);
        if (data.result) setResult({ ...data.result, already: true });
        else setSecondsLeft((data.drive?.test_duration_min ?? 60) * 60);
      })
      .catch((err) => {
        toast(errMsg(err, 'Could not load the test.'), 'error');
        navigate(`/student/drives`);
      })
      .finally(() => setLoading(false));
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driveId]);

  const questions = useMemo(() => paper?.questions ?? [], [paper]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false)).catch(() => {});
    }
  };

  const submit = async (finalAnswers) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const { data } = await drivesApi.submitTest(driveId, finalAnswers ?? answers);
      setResult(data);
      toast('Test submitted and graded.', 'success');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err) {
      toast(errMsg(err, 'Could not submit the test.'), 'error');
      setSubmitting(false);
    }
  };

  const start = () => {
    setStarted(true);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          submit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  if (loading) {
    return (
      <div className="text-sm font-mono text-[var(--text-muted)] py-16 text-center">
        Loading test assessment…
      </div>
    );
  }

  if (!paper) return null;

  // --- Already submitted: Result view ---
  if (result) {
    const pct = Number(result.percentage);
    const passed = pct >= Number(paper.drive?.min_test_score ?? 50);

    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-8 shadow-xs text-center space-y-4">
          <div className="flex justify-center">
            <StampBadge variant={passed ? 'success' : 'neutral'} size="lg" tilt>
              {result.already ? 'OFFICIALLY SUBMITTED' : passed ? 'QUALIFIED FOR INTERVIEW' : 'EVALUATED RECORD'}
            </StampBadge>
          </div>
          <h2 className="text-2xl font-serif font-bold text-midnight dark:text-ivory">
            {result.already ? 'Assessment Record Archived' : 'Examination Completed'}
          </h2>
          <div
            className={`text-5xl font-mono font-bold my-4 ${
              passed ? 'text-emerald dark:text-emerald-light' : 'text-midnight/70 dark:text-brandMuted'
            }`}
          >
            {pct.toFixed(1)}%
          </div>
          <p className="text-xs font-mono text-midnight/60 dark:text-brandMuted">
            SCORE: {Number(result.score)} / {Number(result.total)} MARKS
            {result.submitted_at && ` • RECORDED ${formatDate(result.submitted_at)}`}
          </p>

          {!result.already && (
            <div className="p-3 bg-[#FAF7F0] dark:bg-midnight rounded-[4px] border border-[#E2D9C8] dark:border-midnight-border text-xs text-midnight/80 dark:text-brandMuted">
              {passed
                ? 'Score meets or exceeds the institutional cutoff threshold. You are in the verified pool for technical interviews.'
                : 'Score is below the minimum qualifying cutoff for this drive.'}
            </div>
          )}

          <div className="pt-4">
            <Link to="/student/journey">
              <Button variant="primary">Return to My Journey Track</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-8 text-center space-y-4">
          <p className="text-sm font-mono text-midnight/50 dark:text-brandMuted">This drive has no test question set configured.</p>
          <Link to="/student/drives">
            <Button variant="secondary">Back to Approved Drives</Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- Pre-start instructions screen ---
  if (!started) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <AdmitCard
          serialNumber={`ADMIT-${driveId}`}
          title={paper.drive?.title || 'Aptitude Examination'}
          subTitle={paper.drive?.company?.name || 'Recruitment Partner'}
          date={paper.session?.starts_at ? formatDate(paper.session.starts_at).split(',')[0] : 'Today'}
          time={paper.session?.starts_at ? formatDate(paper.session.starts_at).split(', ')[1] : 'Scheduled'}
          venue={paper.session?.venue || 'Assigned Computer Laboratory'}
          status="READY"
          statusLabel="AUTHORIZED ENTRY"
          statusVariant="gold"
          metaItems={[
            { label: 'QUESTIONS', value: `${questions.length} Items` },
            { label: 'TIME LIMIT', value: `${paper.drive?.test_duration_min || 60} Minutes` },
            { label: 'PASS CUTOFF', value: `${paper.drive?.min_test_score || 50}%` },
            { label: 'PROCTORING', value: 'SECURE KERNEL' },
          ]}
          actionSlot={
            <Button variant="primary" size="lg" className="w-full font-mono text-xs font-bold" onClick={start}>
              Begin Timed Assessment →
            </Button>
          }
        />

        <div className="mt-4">
          <MarginNote title="SUPERVISOR NOTICE" variant="gold">
            Once initiated, the session timer runs continuously. Terminals reporting unauthorized window focus switches or background process violations will be immediately flagged for supervisor review.
          </MarginNote>
        </div>
      </div>
    );
  }

  // --- Live Question View ---
  const q = questions[index];
  const answeredCount = Object.keys(answers).length;
  const urgent = secondsLeft < 300;

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-4">
      {/* Test Header Strip */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] px-5 py-3 shadow-subtle flex items-center justify-between sticky top-20 z-10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Question {index + 1} of {questions.length}
          </span>
          <div className="h-1.5 w-40 bg-[var(--bg-subtle)] rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-[#D9B36C] transition-all"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullScreen}
            className="p-1.5 rounded-[4px] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            title={isFullScreen ? 'Exit full screen' : 'Full screen focus mode'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <div
            className={`font-mono font-bold text-sm px-3 py-1.5 rounded-[6px] border flex items-center gap-1.5 ${
              urgent
                ? 'border-[#9E3524] bg-[#9E3524]/10 text-[#9E3524] animate-pulse'
                : 'border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#D9B36C]" />
            <span>{mmss(secondsLeft)}</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle space-y-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-serif font-bold text-[var(--text-primary)] leading-relaxed">
            {q.text}
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-[4px] bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-muted)] shrink-0">
            {q.marks} Mark{q.marks !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-2.5">
          {q.options.map((opt, oi) => {
            const isSelected = answers[q.id] === oi;
            return (
              <button
                key={oi}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                className={`w-full text-left rounded-[6px] border px-4 py-3 text-sm transition-colors flex items-center gap-3 ${
                  isSelected
                    ? 'border-[#D9B36C] bg-[#D9B36C]/10 text-[var(--text-primary)] font-semibold'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--brand-accent)]/50'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-[4px] flex items-center justify-center text-xs font-mono shrink-0 ${
                    isSelected
                      ? 'bg-[#D9B36C] text-[#0B1F1A] font-bold'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  {String.fromCharCode(65 + oi)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          ← Previous
        </Button>

        <span className="text-xs font-mono text-[var(--text-muted)]">
          {answeredCount} / {questions.length} Answered
        </span>

        {index < questions.length - 1 ? (
          <Button variant="primary" size="sm" onClick={() => setIndex((i) => i + 1)}>
            Next →
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setConfirmSubmitOpen(true)}
            loading={submitting}
          >
            Submit Test
          </Button>
        )}
      </div>

      {/* Confirm Submit Dialog */}
      <ConfirmDialog
        isOpen={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        onConfirm={() => {
          setConfirmSubmitOpen(false);
          submit();
        }}
        title="Submit Assessment?"
        message={`You have answered ${answeredCount} of ${questions.length} questions. You will not be able to change your answers once submitted.`}
        confirmLabel="Yes, Submit Now"
        variant="primary"
      />
    </div>
  );
}
