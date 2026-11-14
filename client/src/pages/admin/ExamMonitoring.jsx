// Exam Monitoring Admin Page — real-time physical exam PC supervision.
// Displays live agent telemetry, connection state, foreground processes,
// and flagged events awaiting human verification.

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import { examMonitoring, errMsg } from '../../api';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';

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

    // Real-time agent status changes (online/offline, heartbeat, foreground window)
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

      // Update unreviewed events count on target PC
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

      toast(`Alert: ${newEvent.event_type} on ${newEvent.pc_code || 'a terminal'}`, 'info');
    });

    // Real-time session changes (allocation, start, end)
    socket.on('session:update', (session) => {
      setPcs((prevPcs) =>
        prevPcs.map((pc) => {
          if (pc.id === session.computer_id) {
            if (session.status === 'ended') {
              return {
                ...pc,
                session_id: null,
                session_status: null,
                student_name: null,
                roll_no: null,
                computer_status: 'available',
              };
            }
            return {
              ...pc,
              session_id: session.id,
              session_status: session.status,
              student_name: session.student_name,
              roll_no: session.roll_no,
              computer_status: 'allocated',
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

  // Aggregate stats
  const activeCount = pcs.filter((p) => p.agent_status === 'online').length;
  const flaggedCount = events.filter((e) => e.review_status === 'new').length;
  const assignedCount = pcs.filter((p) => p.session_id != null).length;
  const disconnectedCount = pcs.filter((p) => p.agent_status === 'offline').length;

  // Group PCs by computer lab
  const labs = useMemo(() => {
    const map = new Map();
    for (const pc of pcs) {
      const labName = pc.lab_name || 'Unassigned Lab';
      if (!map.has(labName)) map.set(labName, []);
      map.get(labName).push(pc);
    }
    return Array.from(map.entries());
  }, [pcs]);

  const selectedPc = pcs.find((p) => p.id === selectedPcId);
  const selectedPcEvents = useMemo(() => {
    if (!selectedPcId) return [];
    return events.filter((e) => e.computer_id === selectedPcId);
  }, [events, selectedPcId]);

  // Submit event review status change
  const handleReview = async (eventId, status) => {
    setSubmittingReview(true);
    try {
      const res = await examMonitoring.reviewEvent(eventId, {
        review_status: status,
        review_note: reviewNote,
      });

      setEvents((prev) => prev.map((e) => (e.id === eventId ? res.data : e)));
      // Decrement unreviewed count if resolved
      setPcs((prevPcs) =>
        prevPcs.map((pc) => {
          if (pc.id === res.data.computer_id) {
            return {
              ...pc,
              unreviewed_events_count: Math.max(0, (Number(pc.unreviewed_events_count) || 0) - 1),
            };
          }
          return pc;
        })
      );

      toast(`Event marked as ${status}.`, 'success');
      setReviewNote('');
    } catch (err) {
      toast(errMsg(err, 'Failed to update review status.'), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

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
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-slate-500">Loading exam terminal status…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Socket Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Exam Monitoring</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time physical PC telemetry and proctoring event supervision.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-50 border border-slate-200">
            <span
              className={`w-2 h-2 rounded-full ${
                socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-600">
              {socketConnected ? 'Live Stream Connected' : 'Connecting to Stream…'}
            </span>
          </div>

          <button
            onClick={loadData}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active PCs"
          value={activeCount}
          accent="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Flagged Events"
          value={flaggedCount}
          accent={flaggedCount > 0 ? 'rose' : 'slate'}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          label="Assigned PCs"
          value={assignedCount}
          accent="indigo"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatCard
          label="Disconnected"
          value={disconnectedCount}
          accent={disconnectedCount > 0 ? 'amber' : 'slate'}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.828-6.364 9 9 0 012.828-6.364m2.828 2.828a5 5 0 012.828 1.414" />
            </svg>
          }
        />
      </div>

      {/* Main Grid: Lab PC Cards + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PC Cards Grouped by Lab (Takes 2 cols on desktop) */}
        <div className={`space-y-6 ${selectedPc ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {labs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
              <EmptyState
                title="No Exam PCs Found"
                message="Enroll physical computers in Exam PCs to begin monitoring."
              />
            </div>
          ) : (
            labs.map(([labName, labPcs]) => (
              <div key={labName} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{labName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {labPcs.length} PCs
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {labPcs.filter((p) => p.agent_status === 'online').length} online
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {labPcs.map((pc) => {
                    const isSelected = selectedPcId === pc.id;
                    const unreviewed = Number(pc.unreviewed_events_count) || 0;
                    return (
                      <div
                        key={pc.id}
                        onClick={() => setSelectedPcId(isSelected ? null : pc.id)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/20 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-slate-800">{pc.pc_code}</span>
                          <div className="flex items-center gap-1.5">
                            {unreviewed > 0 && (
                              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                                {unreviewed}
                              </span>
                            )}
                            <Badge variant={pc.agent_status === 'online' ? 'success' : 'neutral'}>
                              {pc.agent_status === 'online' ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                        </div>

                        {/* Session / Student Info */}
                        <div className="text-xs text-slate-500 mb-2 min-h-[32px]">
                          {pc.student_name ? (
                            <div>
                              <div className="font-medium text-slate-700">{pc.student_name}</div>
                              <div className="text-[11px] text-slate-400">
                                Roll: {pc.roll_no || '—'} · Status: {pc.session_status}
                              </div>
                            </div>
                          ) : (
                            <div className="italic text-slate-400 pt-1">No active exam session</div>
                          )}
                        </div>

                        {/* Foreground App Info */}
                        <div className="pt-2 border-t border-slate-100 text-[11px] space-y-0.5">
                          <div className="text-slate-400 truncate">
                            Proc: <span className="text-slate-600 font-mono">{pc.last_foreground_process || 'idle'}</span>
                          </div>
                          <div className="text-slate-400 truncate" title={pc.last_foreground_title || ''}>
                            Win: <span className="text-slate-700">{pc.last_foreground_title || '—'}</span>
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

        {/* Side Panel: Selected PC Details & Flag History */}
        {selectedPc && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-5 lg:col-span-1 self-start">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedPc.pc_code}</h3>
                <p className="text-xs text-slate-400">{selectedPc.lab_name} · Host: {selectedPc.hostname || 'Unknown'}</p>
              </div>
              <button
                onClick={() => setSelectedPcId(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* MANDATORY PROCTORING TEXT NOTICE */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed font-medium">
              ⚠️ <strong>Notice:</strong> Flags need human review; they are not proof of cheating.
            </div>

            {/* Current Session Snapshot */}
            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5 border border-slate-200/60">
              <div className="font-semibold text-slate-700">Exam Session Info</div>
              <div className="text-slate-600">
                Student: <strong>{selectedPc.student_name || 'None'}</strong>
              </div>
              <div className="text-slate-600">
                Keyword: <code>{selectedPc.exam_window_keyword || 'CampusFlow'}</code>
              </div>
              <div className="text-slate-600">
                Agent Version: {selectedPc.agent_version || '1.0.0'}
              </div>
            </div>

            {/* Event History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-700 uppercase tracking-wide">
                  Telemetry Events ({selectedPcEvents.length})
                </span>
              </div>

              {selectedPcEvents.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No telemetry anomalies reported for this terminal.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 slim-scroll">
                  {selectedPcEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant={eventBadgeVariant(ev.event_type)}>
                          {ev.event_type}
                        </Badge>
                        <span className="text-[11px] text-slate-400">
                          {new Date(ev.occurred_at).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="space-y-0.5 text-slate-600">
                        <div>
                          Proc: <span className="font-mono text-slate-800 font-medium">{ev.process_name || '—'}</span>
                        </div>
                        <div className="truncate" title={ev.window_title}>
                          Title: <span className="text-slate-800">{ev.window_title || '—'}</span>
                        </div>
                        {ev.review_note && (
                          <div className="italic text-slate-500 pt-1">
                            Note: "{ev.review_note}"
                          </div>
                        )}
                      </div>

                      {/* Review Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-400">
                          Review: <span className="font-medium text-slate-700">{ev.review_status}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {ev.review_status === 'new' && (
                            <>
                              <button
                                disabled={submittingReview}
                                onClick={() => handleReview(ev.id, 'reviewed')}
                                className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                              >
                                Review
                              </button>
                              <button
                                disabled={submittingReview}
                                onClick={() => handleReview(ev.id, 'dismissed')}
                                className="px-2 py-1 text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                          {ev.review_status !== 'new' && (
                            <button
                              disabled={submittingReview}
                              onClick={() => handleReview(ev.id, 'new')}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
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
