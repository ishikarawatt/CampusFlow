// Exam Monitoring Admin Page — real-time physical exam PC supervision.
// Redesigned with the Midnight x Emerald x Champagne Gold visual identity:
// Stat strip with count-up numbers, lab-grouped PC cards with live pulse dots,
// and side drawer for telemetry review with real Socket.IO integration.

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import { examMonitoring, errMsg } from '../../api';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import Button from '../../components/Button';
import Skeleton from '../../components/Skeleton';
import PageHeader from '../../components/PageHeader';
import { MonitorCheck, Server, AlertTriangle, Activity, RefreshCw, X, ShieldAlert, Cpu } from 'lucide-react';

export default function ExamMonitoring() {
  const { toast } = useToast();
  const [pcs, setPcs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedPcId, setSelectedPcId] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch PCs and recent events
  const loadData = useCallback(async () => {
    try {
      const [pcRes, eventRes] = await Promise.all([
        examMonitoring.pcs(),
        examMonitoring.events({ limit: 100 }),
      ]);
      setPcs(pcRes.data);
      setEvents(eventRes.data);
    } catch (err) {
      toast(errMsg(err, 'Failed to load monitoring data.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Connect to live Socket.IO feed
  useEffect(() => {
    const token = localStorage.getItem('campusflow_token');
    const socket = io({
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Real-time agent status changes
    socket.on('agent:status', (data) => {
      setPcs((prevPcs) =>
        prevPcs.map((pc) => {
          if (pc.id === data.computer_id) {
            return {
              ...pc,
              agent_status: data.status ?? pc.agent_status,
              last_foreground_title: data.last_foreground_title ?? pc.last_foreground_title,
              last_foreground_process: data.last_foreground_process ?? pc.last_foreground_process,
              computer_status: data.status === 'allocated' ? 'allocated' : pc.computer_status,
            };
          }
          return pc;
        })
      );
    });

    // Real-time violation/telemetry events
    socket.on('agent:event', (newEvent) => {
      setEvents((prevEvents) => {
        const filtered = prevEvents.filter((e) => e.id !== newEvent.id);
        return [newEvent, ...filtered];
      });

      setPcs((prevPcs) =>
        prevPcs.map((pc) => {
          if (pc.id === newEvent.computer_id && newEvent.review_status === 'new') {
            return {
              ...pc,
              unreviewed_events_count: (Number(pc.unreviewed_events_count) || 0) + 1,
            };
          }
          return pc;
        })
      );

      toast(`Telemetry Flag: ${newEvent.event_type} on ${newEvent.pc_code || 'a terminal'}`, 'info');
    });

    // Real-time session changes
    socket.on('session:change', (sessionData) => {
      setPcs((prevPcs) =>
        prevPcs.map((pc) => {
          if (pc.id === sessionData.computer_id) {
            return {
              ...pc,
              active_session_id: sessionData.status === 'ended' ? null : sessionData.session_id,
              student_name: sessionData.student_name ?? pc.student_name,
              session_status: sessionData.status ?? pc.session_status,
            };
          }
          return pc;
        })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [toast]);

  // Group PCs by lab
  const labGroups = useMemo(() => {
    const groups = {};
    pcs.forEach((pc) => {
      const labName = pc.lab_name || 'General Terminal Pool';
      if (!groups[labName]) groups[labName] = [];
      groups[labName].push(pc);
    });
    return groups;
  }, [pcs]);

  // Selected PC details
  const selectedPc = useMemo(() => {
    return pcs.find((p) => p.id === selectedPcId) || null;
  }, [pcs, selectedPcId]);

  // Events filtered for selected PC
  const selectedPcEvents = useMemo(() => {
    if (!selectedPcId) return [];
    return events.filter((e) => e.computer_id === selectedPcId);
  }, [events, selectedPcId]);

  // Review action handler
  const handleReview = async (eventId, action) => {
    setSubmittingReview(true);
    try {
      await examMonitoring.reviewEvent(eventId, {
        review_status: action,
        review_note: reviewNote.trim() || undefined,
      });

      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId
            ? { ...ev, review_status: action, review_note: reviewNote.trim() || ev.review_note }
            : ev
        )
      );

      setPcs((prev) =>
        prev.map((pc) => {
          if (pc.id === selectedPcId) {
            return {
              ...pc,
              unreviewed_events_count: Math.max(0, (Number(pc.unreviewed_events_count) || 1) - 1),
            };
          }
          return pc;
        })
      );

      setReviewNote('');
      toast(`Event marked as ${action}.`, 'success');
    } catch (err) {
      toast(errMsg(err, 'Failed to update review status.'), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const activeCount = pcs.filter((p) => p.agent_status === 'online').length;
  const inSessionCount = pcs.filter((p) => Boolean(p.active_session_id)).length;
  const flagCount = events.filter((e) => e.review_status === 'new').length;

  const eventBadgeVariant = (type) => {
    switch (type) {
      case 'PROHIBITED_PROCESS':
        return 'danger';
      case 'FOCUS_LOST':
      case 'WINDOW_MINIMIZED':
      case 'WINDOW_CLOSED':
        return 'warning';
      case 'AGENT_DISCONNECTED':
        return 'danger';
      case 'AGENT_RECONNECTED':
        return 'success';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[10px]" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-[10px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Monitoring"
        subtitle="Real-time physical PC telemetry and proctoring event supervision."
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Exam Monitoring' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-mono bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-[#0F7B5F] cf-live-pulse' : 'bg-[#9E3524]'
                }`}
              />
              <span className="text-[var(--text-muted)]">
                {socketConnected ? 'Live Socket Stream' : 'Connecting to Stream…'}
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={loadData}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Stats KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Terminals"
          value={activeCount}
          icon={<MonitorCheck className="w-5 h-5" />}
        />
        <StatCard
          label="In Exam Session"
          value={inSessionCount}
          icon={<Server className="w-5 h-5" />}
        />
        <StatCard
          label="Pending Review"
          value={flagCount}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          label="Total Terminals"
          value={pcs.length}
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      {/* Main Grid: Lab Groupings & PC Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className={`${selectedPc ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          {Object.keys(labGroups).length === 0 ? (
            <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-8">
              <EmptyState
                title="No Exam Terminals Enrolled"
                message="Enroll student workstations via the Exam PCs administration tab."
              />
            </div>
          ) : (
            Object.entries(labGroups).map(([labName, labPcs]) => (
              <div
                key={labName}
                className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5 shadow-subtle"
              >
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--border-color)]">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif font-bold text-base text-[var(--text-primary)]">
                      {labName}
                    </h2>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      ({labPcs.length} workstations)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
                    <span className="w-2 h-2 rounded-full bg-[#0F7B5F]" />
                    <span>{labPcs.filter((p) => p.agent_status === 'online').length} online</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {labPcs.map((pc) => {
                    const isSelected = selectedPcId === pc.id;
                    const isOnline = pc.agent_status === 'online';
                    const hasActiveSession = Boolean(pc.active_session_id);
                    const unreviewedCount = Number(pc.unreviewed_events_count) || 0;

                    return (
                      <div
                        key={pc.id}
                        onClick={() => setSelectedPcId(isSelected ? null : pc.id)}
                        className={`cursor-pointer rounded-[8px] p-4 border transition-all text-left relative ${
                          isSelected
                            ? 'border-[#D9B36C] bg-[var(--bg-subtle)] shadow-panel'
                            : 'border-[var(--border-color)] bg-[var(--bg-surface-elevated)] hover:border-[#0F7B5F]'
                        }`}
                      >
                        {/* Terminal Header */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border-color)]/60">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isOnline ? 'bg-[#0F7B5F] cf-live-pulse' : 'bg-[var(--text-muted)] opacity-50'
                              }`}
                            />
                            <span className="font-mono font-bold text-xs text-[var(--text-primary)]">
                              {pc.pc_code}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {unreviewedCount > 0 && (
                              <Badge variant="danger">{unreviewedCount} flags</Badge>
                            )}
                            <Badge variant={isOnline ? 'success' : 'neutral'}>
                              {isOnline ? 'ONLINE' : 'OFFLINE'}
                            </Badge>
                          </div>
                        </div>

                        {/* Candidate Session info */}
                        <div className="py-2.5 text-xs space-y-1">
                          {hasActiveSession ? (
                            <div>
                              <div className="font-serif font-bold text-[var(--text-primary)] truncate">
                                {pc.student_name || 'Student Candidate'}
                              </div>
                              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                                Roll: {pc.roll_no || '—'} · Status: {pc.session_status}
                              </div>
                            </div>
                          ) : (
                            <div className="italic text-[var(--text-muted)] py-0.5">
                              No active candidate session
                            </div>
                          )}
                        </div>

                        {/* Foreground Process & Window Telemetry */}
                        <div className="pt-2 border-t border-[var(--border-color)]/60 text-[11px] font-mono space-y-0.5">
                          <div className="text-[var(--text-muted)] truncate">
                            Proc: <span className="text-[var(--text-primary)] font-semibold">{pc.last_foreground_process || 'idle'}</span>
                          </div>
                          <div className="text-[var(--text-muted)] truncate" title={pc.last_foreground_title || ''}>
                            Win: <span className="text-[var(--text-secondary)]">{pc.last_foreground_title || '—'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Side Panel: Selected PC Details & Live Anomaly Audit */}
        {selectedPc && (
          <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5 shadow-panel space-y-5 lg:col-span-1 self-start cf-transition">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                  {selectedPc.pc_code}
                </h3>
                <p className="text-xs font-mono text-[var(--text-muted)]">
                  {selectedPc.lab_name} · Host: {selectedPc.hostname || 'Unknown'}
                </p>
              </div>
              <button
                onClick={() => setSelectedPcId(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-[4px]"
                aria-label="Close inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MANDATORY PROCTORING TEXT NOTICE */}
            <div className="p-3.5 bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] rounded-[6px] text-xs text-[var(--status-warning-text)] leading-relaxed font-medium">
              ⚠️ <strong>Notice:</strong> Flags need human review; they are not proof of cheating.
            </div>

            {/* Current Session Snapshot */}
            <div className="bg-[var(--bg-subtle)] p-3.5 rounded-[6px] text-xs space-y-1.5 border border-[var(--border-color)]">
              <div className="font-serif font-bold text-[var(--text-primary)]">Exam Session Info</div>
              <div className="text-[var(--text-secondary)]">
                Student: <strong>{selectedPc.student_name || 'None'}</strong>
              </div>
              <div className="text-[var(--text-secondary)] font-mono text-[11px]">
                Keyword: <code>{selectedPc.exam_window_keyword || 'CampusFlow'}</code>
              </div>
              <div className="text-[var(--text-secondary)] font-mono text-[11px]">
                Agent Version: {selectedPc.agent_version || '1.0.0'}
              </div>
            </div>

            {/* Event History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Telemetry Events ({selectedPcEvents.length})
                </span>
              </div>

              {selectedPcEvents.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] rounded-[6px]">
                  No anomalies reported for this terminal.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 slim-scroll">
                  {selectedPcEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] text-xs space-y-2 shadow-subtle"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant={eventBadgeVariant(ev.event_type)}>
                          {ev.event_type}
                        </Badge>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          {new Date(ev.occurred_at).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="space-y-0.5 text-[var(--text-secondary)] font-mono text-[11px]">
                        <div>
                          Proc: <span className="text-[var(--text-primary)] font-semibold">{ev.process_name || '—'}</span>
                        </div>
                        <div className="truncate font-sans" title={ev.window_title}>
                          Title: <span className="text-[var(--text-primary)]">{ev.window_title || '—'}</span>
                        </div>
                        {ev.review_note && (
                          <div className="italic text-[var(--text-muted)] pt-1 font-sans">
                            Note: "{ev.review_note}"
                          </div>
                        )}
                      </div>

                      {/* Review Buttons */}
                      {ev.review_status === 'new' ? (
                        <div className="pt-2 border-t border-[var(--border-color)] space-y-2">
                          <input
                            type="text"
                            placeholder="Add human review note (optional)..."
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-[4px] border border-[var(--border-color)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C]"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={submittingReview}
                              onClick={() => handleReview(ev.id, 'dismissed')}
                              className="flex-1 py-1 text-xs"
                            >
                              Dismiss
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={submittingReview}
                              onClick={() => handleReview(ev.id, 'reviewed')}
                              className="flex-1 py-1 text-xs"
                            >
                              Confirm
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1.5 border-t border-[var(--border-color)] flex items-center justify-between text-[11px]">
                          <span className="text-[var(--text-muted)]">Status:</span>
                          <span className="font-mono uppercase font-semibold text-[var(--brand-primary)]">
                            {ev.review_status}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
