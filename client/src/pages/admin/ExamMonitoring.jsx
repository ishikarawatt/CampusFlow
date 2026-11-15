// Exam Monitoring Admin Page — Real-time physical exam PC supervision.
// Built with the Campus Registrar Visual Language:
// SeatMap floor plan with physical desk glyphs, ControlRoomTicker live feed,
// LedgerStrip telemetry KPIs, and side inspector drawer with mandatory human-review notice.

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import { examMonitoring, errMsg } from '../../api';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import Button from '../../components/Button';
import Skeleton from '../../components/Skeleton';
import PageHeader from '../../components/PageHeader';
import {
  LedgerStrip,
  SeatMap,
  ControlRoomTicker,
  StampBadge,
  MarginNote,
} from '../../components/signature';
import { MonitorCheck, Server, AlertTriangle, RefreshCw, X, ShieldAlert } from 'lucide-react';

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
      toast(errMsg(err, 'Failed to load monitoring data.'), 'danger');
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
    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Real-time PC heartbeat updates
    socket.on('agent:heartbeat', (data) => {
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
      groups[labName].push({
        ...pc,
        is_flagged: (Number(pc.unreviewed_events_count) || 0) > 0,
        status: pc.agent_status === 'online' ? 'online' : pc.computer_status || 'offline',
        is_allocated: Boolean(pc.active_session_id),
        current_student_name: pc.student_name,
      });
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

      setPcs((prevPcs) =>
        prevPcs.map((pc) => {
          if (pc.id === selectedPcId) {
            return {
              ...pc,
              unreviewed_events_count: Math.max(0, (Number(pc.unreviewed_events_count) || 1) - 1),
            };
          }
          return pc;
        })
      );

      toast(`Event flagged as ${action}.`, 'success');
      setReviewNote('');
    } catch (err) {
      toast(errMsg(err, 'Failed to update review status.'), 'danger');
    } finally {
      setSubmittingReview(false);
    }
  };

  const activeCount = pcs.filter((p) => p.agent_status === 'online').length;
  const inSessionCount = pcs.filter((p) => Boolean(p.active_session_id)).length;
  const flagCount = pcs.filter((p) => (Number(p.unreviewed_events_count) || 0) > 0).length;
  const totalEventsCount = events.filter((e) => e.review_status === 'new').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[6px]" />
        <Skeleton className="h-24 w-full rounded-[6px]" />
        <Skeleton className="h-96 rounded-[6px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Supervision Console"
        subtitle="Real-time physical PC telemetry and proctoring event supervision."
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Exam Monitoring' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-mono bg-white dark:bg-midnight-surface border border-[#D9CEBA] dark:border-midnight-border">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-midnight/70 dark:text-brandMuted">
                {socketConnected ? 'LIVE SOCKET STREAM' : 'CONNECTING...'}
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

      {/* 1. Archival Ledger Strip (Replacing StatCards) */}
      <LedgerStrip
        items={[
          {
            label: 'ONLINE WORKSTATIONS',
            value: activeCount,
            unit: `/ ${pcs.length}`,
            trend: activeCount > 0 ? 'up' : null,
            subtext: `${pcs.length - activeCount} offline terminals`,
          },
          {
            label: 'CANDIDATES IN SESSION',
            value: inSessionCount,
            unit: 'Active',
            subtext: 'Proctored by Secure Kernel',
          },
          {
            label: 'TERMINALS FLAGGED',
            value: flagCount,
            unit: 'PCs',
            badge: flagCount > 0 ? 'REVIEW REQD' : undefined,
            subtext: 'Contain unreviewed flags',
          },
          {
            label: 'UNREVIEWED ANOMALIES',
            value: totalEventsCount,
            unit: 'Flags',
            subtext: 'Awaiting human proctor review',
          },
        ]}
      />

      {/* 2. Main Floor Plan & Side Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Floor Plans per Lab + Live ControlRoomTicker */}
        <div className={`${selectedPc ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          {Object.keys(labGroups).length === 0 ? (
            <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-8">
              <EmptyState
                title="No Exam Terminals Enrolled"
                message="Enroll student workstations via the Exam PCs administration tab."
              />
            </div>
          ) : (
            Object.entries(labGroups).map(([labName, labPcs]) => (
              <SeatMap
                key={labName}
                pcs={labPcs}
                selectedPcId={selectedPcId}
                onSelectPc={(pc) => setSelectedPcId(pc.id === selectedPcId ? null : pc.id)}
                columnsCount={5}
              />
            ))
          )}

          {/* Real-time Monospaced Ruled Live Telemetry Feed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono tracking-wider uppercase text-midnight/50 dark:text-brandMuted font-bold">
                AUDIT TELEMETRY LOG
              </span>
              <span className="text-xs font-mono text-emerald dark:text-emerald-light">
                {events.length} Events Logged
              </span>
            </div>
            <ControlRoomTicker
              events={events}
              onReview={(ev) => {
                setSelectedPcId(ev.computer_id);
              }}
            />
          </div>
        </div>

        {/* Right 1 Col: Selected PC Inspector Drawer */}
        {selectedPc && (
          <div className="bg-white dark:bg-midnight-surface rounded-[6px] border-2 border-emerald-700/40 dark:border-emerald-500/40 p-5 shadow-panel space-y-5 lg:col-span-1 self-start">
            <div className="flex items-center justify-between border-b border-[#E8E0D0] dark:border-midnight-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-midnight/50 dark:text-brandMuted uppercase tracking-wider">
                  TERMINAL INSPECTOR
                </span>
                <h3 className="font-serif font-bold text-lg text-midnight dark:text-ivory">
                  {selectedPc.pc_code}
                </h3>
                <p className="text-xs font-mono text-midnight/60 dark:text-brandMuted">
                  {selectedPc.lab_name} • Host: {selectedPc.hostname || 'Unknown'}
                </p>
              </div>
              <button
                onClick={() => setSelectedPcId(null)}
                className="text-midnight/60 dark:text-brandMuted hover:text-midnight p-1 rounded"
                aria-label="Close inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MANDATORY PROCTORING TEXT NOTICE - MUST BE PRESERVED */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-600/40 rounded-[4px] text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
              ⚠️ <strong>Notice:</strong> Flags need human review; they are not proof of cheating.
            </div>

            {/* Session Snapshot */}
            <div className="bg-[#FAF7F0] dark:bg-midnight p-3.5 rounded-[4px] text-xs space-y-1.5 border border-[#E2D9C8] dark:border-midnight-border">
              <div className="font-serif font-bold text-midnight dark:text-ivory">Active Session State</div>
              <div className="text-midnight/80 dark:text-brandMuted">
                Candidate: <strong className="text-midnight dark:text-ivory">{selectedPc.student_name || 'Unassigned'}</strong>
              </div>
              <div className="text-midnight/70 dark:text-brandMuted font-mono text-[11px]">
                Keyword: <code>{selectedPc.exam_window_keyword || 'CampusFlow'}</code>
              </div>
              <div className="text-midnight/70 dark:text-brandMuted font-mono text-[11px]">
                Proctor Daemon: {selectedPc.agent_version || '1.0.0'}
              </div>
              <div className="text-midnight/70 dark:text-brandMuted font-mono text-[11px] truncate">
                Window: {selectedPc.last_foreground_title || 'None'}
              </div>
            </div>

            {/* Terminal Anomaly History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-midnight/60 dark:text-brandMuted">
                  Terminal Events ({selectedPcEvents.length})
                </span>
              </div>

              {selectedPcEvents.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-midnight/40 dark:text-brandMuted bg-[#FAF7F0] dark:bg-midnight rounded-[4px]">
                  No anomalies recorded for this terminal.
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {selectedPcEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 bg-[#FAF7F0] dark:bg-midnight border border-[#E2D9C8] dark:border-midnight-border rounded-[4px] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <StampBadge
                          variant={
                            ev.review_status === 'dismissed'
                              ? 'neutral'
                              : ev.review_status === 'confirmed'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {ev.event_type}
                        </StampBadge>
                        <span className="font-mono text-[10px] text-midnight/50 dark:text-brandMuted">
                          {formatDate(ev.created_at)}
                        </span>
                      </div>

                      <p className="font-mono text-[11px] text-midnight dark:text-ivory">
                        {ev.details || ev.window_title || ev.process_name || 'Violation recorded'}
                      </p>

                      {ev.review_status === 'new' ? (
                        <div className="pt-2 border-t border-[#E8E0D0] dark:border-midnight-border flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Proctor review note..."
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            className="flex-1 px-2 py-1 text-[11px] rounded border border-[#C8BDA7] dark:border-midnight-border bg-white dark:bg-midnight text-midnight dark:text-ivory font-mono"
                          />
                          <button
                            onClick={() => handleReview(ev.id, 'dismissed')}
                            disabled={submittingReview}
                            className="px-2 py-1 text-[10px] font-mono border border-emerald-600 text-emerald-800 dark:text-emerald-300 rounded hover:bg-emerald-50"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleReview(ev.id, 'confirmed')}
                            disabled={submittingReview}
                            className="px-2 py-1 text-[10px] font-mono bg-rose-600 text-white rounded hover:bg-rose-700"
                          >
                            Confirm Flag
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-midnight/50 dark:text-brandMuted">
                          Reviewed as: <strong>{ev.review_status}</strong>
                          {ev.review_note && ` — "${ev.review_note}"`}
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
