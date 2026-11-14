// Exam PCs Admin Page — hardware provisioning, PC allocation to students,
// session lifecycle control, and prohibited processes management.
// Every action hits real endpoints; no mocked responses.

import React, { useEffect, useState, useCallback } from 'react';
import { examMonitoring, resources as resourcesApi, users as usersApi, drives as drivesApi, errMsg } from '../../api';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';

export default function ExamPcs() {
  const { toast } = useToast();

  const [pcs, setPcs] = useState([]);
  const [labs, setLabs] = useState([]);
  const [students, setStudents] = useState([]);
  const [drivesList, setDrivesList] = useState([]);
  const [prohibited, setProhibited] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & form state
  const [showAddPc, setShowAddPc] = useState(false);
  const [newPcLabId, setNewPcLabId] = useState('');
  const [newPcCode, setNewPcCode] = useState('');
  const [enrollmentResult, setEnrollmentResult] = useState(null);

  const [showAllocate, setShowAllocate] = useState(false);
  const [allocPcId, setAllocPcId] = useState('');
  const [allocStudentId, setAllocStudentId] = useState('');
  const [allocDriveId, setAllocDriveId] = useState('');
  const [allocKeyword, setAllocKeyword] = useState('CampusFlow');
  const [allocError, setAllocError] = useState('');

  const [newProcName, setNewProcName] = useState('');
  const [submittingProc, setSubmittingProc] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [pcRes, resList, userList, driveList, procList] = await Promise.all([
        examMonitoring.pcs(),
        resourcesApi.list(),
        usersApi.list(),
        drivesApi.list(),
        examMonitoring.prohibitedProcesses(),
      ]);

      setPcs(pcRes.data);
      setLabs((resList.data || []).filter((r) => r.type === 'lab'));
      setStudents((userList.data || []).filter((u) => u.role === 'student'));
      setDrivesList(driveList.data || []);
      setProhibited(procList.data || []);
    } catch (err) {
      toast(errMsg(err, 'Failed to load PC management data.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create new PC
  const handleCreatePc = async (e) => {
    e.preventDefault();
    if (!newPcLabId || !newPcCode.trim()) {
      toast('Please select a lab and enter a PC code.', 'error');
      return;
    }

    try {
      const res = await examMonitoring.createComputer({
        resource_id: Number(newPcLabId),
        pc_code: newPcCode.trim().toUpperCase(),
      });

      setEnrollmentResult({
        pc_code: res.data.pc_code,
        enrollment_code: res.data.enrollment_code,
      });

      toast(`PC ${res.data.pc_code} registered successfully!`, 'success');
      setNewPcCode('');
      loadData();
    } catch (err) {
      toast(errMsg(err, 'Failed to create computer.'), 'error');
    }
  };

  // Regenerate enrollment code
  const handleRegenerateCode = async (pcId) => {
    try {
      const res = await examMonitoring.regenerateEnrollment(pcId);
      setEnrollmentResult({
        pc_code: res.data.pc_code,
        enrollment_code: res.data.enrollment_code,
      });
      toast(`New enrollment code generated for ${res.data.pc_code}.`, 'success');
      loadData();
    } catch (err) {
      toast(errMsg(err, 'Failed to regenerate code.'), 'error');
    }
  };

  // Allocate Student to PC
  const handleAllocate = async (e) => {
    e.preventDefault();
    setAllocError('');

    if (!allocPcId || !allocStudentId) {
      setAllocError('Please select both a computer and a student.');
      return;
    }

    try {
      await examMonitoring.allocateSession({
        computer_id: Number(allocPcId),
        student_id: Number(allocStudentId),
        drive_id: allocDriveId ? Number(allocDriveId) : null,
        exam_window_keyword: allocKeyword.trim() || 'CampusFlow',
      });

      toast('PC allocated to student successfully!', 'success');
      setShowAllocate(false);
      setAllocPcId('');
      setAllocStudentId('');
      loadData();
    } catch (err) {
      const msg = errMsg(err, 'Failed to allocate PC.');
      setAllocError(msg);
      toast(msg, 'error');
    }
  };

  // Start Session
  const handleStartSession = async (sessionId) => {
    try {
      await examMonitoring.startSession(sessionId);
      toast('Exam session started!', 'success');
      loadData();
    } catch (err) {
      toast(errMsg(err, 'Failed to start session.'), 'error');
    }
  };

  // End Session (releases the PC)
  const handleEndSession = async (sessionId) => {
    try {
      await examMonitoring.endSession(sessionId);
      toast('Exam session ended. PC released back to available pool.', 'success');
      loadData();
    } catch (err) {
      toast(errMsg(err, 'Failed to end session.'), 'error');
    }
  };

  // Add Prohibited Process
  const handleAddProcess = async (e) => {
    e.preventDefault();
    if (!newProcName.trim()) return;

    setSubmittingProc(true);
    try {
      await examMonitoring.addProhibitedProcess({
        process_name: newProcName.trim(),
      });
      toast(`Added '${newProcName.trim().toLowerCase()}' to prohibited list.`, 'success');
      setNewProcName('');
      const procs = await examMonitoring.prohibitedProcesses();
      setProhibited(procs.data);
    } catch (err) {
      toast(errMsg(err, 'Failed to add prohibited process.'), 'error');
    } finally {
      setSubmittingProc(false);
    }
  };

  // Delete Prohibited Process
  const handleDeleteProcess = async (id) => {
    try {
      await examMonitoring.removeProhibitedProcess(id);
      toast('Process removed from prohibited list.', 'success');
      setProhibited((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast(errMsg(err, 'Failed to delete prohibited process.'), 'error');
    }
  };

  const availablePcs = pcs.filter((p) => p.computer_status === 'available');
  const activeSessions = pcs.filter((p) => p.session_id != null);

  const pcColumns = [
    {
      key: 'pc_code',
      label: 'PC Code',
      render: (r) => <span className="font-bold text-slate-800">{r.pc_code}</span>,
    },
    {
      key: 'lab_name',
      label: 'Lab Resource',
      render: (r) => <span className="text-slate-600">{r.lab_name}</span>,
    },
    {
      key: 'computer_status',
      label: 'PC Status',
      render: (r) => (
        <Badge variant={r.computer_status === 'available' ? 'success' : 'warning'}>
          {r.computer_status}
        </Badge>
      ),
    },
    {
      key: 'agent_status',
      label: 'Agent Link',
      render: (r) => (
        <Badge variant={r.agent_status === 'online' ? 'success' : 'neutral'}>
          {r.agent_status === 'online' ? 'Online' : 'Offline'}
        </Badge>
      ),
    },
    {
      key: 'enrollment_code',
      label: 'Enrollment Code',
      render: (r) => (
        <div className="flex items-center gap-2">
          <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">
            {r.enrollment_code}
          </code>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(r.enrollment_code);
              toast('Enrollment code copied to clipboard!', 'info');
            }}
            title="Copy code"
            className="text-slate-400 hover:text-slate-600 text-xs p-1"
          >
            📋
          </button>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <button
          onClick={() => handleRegenerateCode(r.id)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Regenerate Code
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-slate-500">Loading exam terminal configuration…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Exam PC Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Hardware provisioning, student terminal allocation, and process enforcement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAllocate(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            + Allocate Student
          </button>
          <button
            onClick={() => setShowAddPc(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            + Add Computer
          </button>
        </div>
      </div>

      {/* Enrollment Code Alert Box (Shown once upon creation or regeneration) */}
      {enrollmentResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div>
            <div className="font-bold text-sm text-emerald-900">
              Terminal Provisioned: {enrollmentResult.pc_code}
            </div>
            <p className="text-xs text-emerald-700 mt-0.5">
              Enter this enrollment code during agent setup on the physical Windows PC:
            </p>
            <div className="mt-2 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-300">
              <span className="font-mono text-sm font-bold text-emerald-900 select-all">
                {enrollmentResult.enrollment_code}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(enrollmentResult.enrollment_code);
                  toast('Enrollment code copied!', 'info');
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Copy
              </button>
            </div>
          </div>
          <button
            onClick={() => setEnrollmentResult(null)}
            className="text-emerald-600 hover:text-emerald-800 text-sm font-bold p-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add Computer Modal */}
      {showAddPc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Register New Exam PC</h3>
              <button onClick={() => setShowAddPc(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreatePc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Computer Lab</label>
                <select
                  value={newPcLabId}
                  onChange={(e) => setNewPcLabId(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a lab…</option>
                  {labs.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name} (Capacity: {lab.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PC Code</label>
                <input
                  type="text"
                  placeholder="e.g. LAB-A-PC06"
                  value={newPcCode}
                  onChange={(e) => setNewPcCode(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPc(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Generate Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Student Modal */}
      {showAllocate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Allocate PC to Student</h3>
              <button onClick={() => setShowAllocate(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {allocError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {allocError}
              </div>
            )}

            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Available PC</label>
                <select
                  value={allocPcId}
                  onChange={(e) => setAllocPcId(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Choose an available PC…</option>
                  {availablePcs.map((pc) => (
                    <option key={pc.id} value={pc.id}>
                      {pc.pc_code} ({pc.lab_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student</label>
                <select
                  value={allocStudentId}
                  onChange={(e) => setAllocStudentId(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Choose a student…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Drive (Optional)</label>
                <select
                  value={allocDriveId}
                  onChange={(e) => setAllocDriveId(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No Drive Associated</option>
                  {drivesList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.company_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Window Keyword</label>
                <input
                  type="text"
                  value={allocKeyword}
                  onChange={(e) => setAllocKeyword(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Foreground window title must contain this keyword during the exam.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocate(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Exam Sessions Section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-base text-slate-900">Current Exam Sessions</h2>
            <p className="text-xs text-slate-500">Allocated PCs with active or scheduled testing.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
            {activeSessions.length} Assigned
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <EmptyState
            title="No Active Allocations"
            message="No students are currently allocated to exam PCs. Use '+ Allocate Student' to assign a terminal."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="py-2.5 px-3">PC Code</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Session Status</th>
                  <th className="py-2.5 px-3">Keyword</th>
                  <th className="py-2.5 px-3">Scheduled Start</th>
                  <th className="py-2.5 px-3 text-right">Session Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeSessions.map((session) => (
                  <tr key={session.session_id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-bold text-slate-800">{session.pc_code}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{session.student_name}</div>
                      <div className="text-xs text-slate-400">Roll: {session.roll_no || '—'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={session.session_status === 'active' ? 'success' : 'info'}>
                        {session.session_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {session.exam_window_keyword}
                      </code>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">
                      {session.starts_at ? new Date(session.starts_at).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {session.session_status === 'scheduled' && (
                        <button
                          onClick={() => handleStartSession(session.session_id)}
                          className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          Start Exam
                        </button>
                      )}
                      <button
                        onClick={() => handleEndSession(session.session_id)}
                        className="px-3 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        End & Free PC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Physical Computers Directory */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-bold text-base text-slate-900">Provisioned Lab Computers</h2>
          <p className="text-xs text-slate-500">Physical machines registered in computer labs.</p>
        </div>

        <DataTable
          columns={pcColumns}
          rows={pcs}
          emptyHint="No computers enrolled yet. Click '+ Add Computer' to register one."
        />
      </div>

      {/* Prohibited Processes Section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-base text-slate-900">Prohibited Processes</h2>
            <p className="text-xs text-slate-500">
              Communication, remote desktop, and AI companion apps restricted during exams. Web browsers remain permitted.
            </p>
          </div>

          <form onSubmit={handleAddProcess} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. slack.exe"
              value={newProcName}
              onChange={(e) => setNewProcName(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <button
              type="submit"
              disabled={submittingProc || !newProcName.trim()}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            >
              Add Process
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {prohibited.map((proc) => (
            <div
              key={proc.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs"
            >
              <div className="font-mono text-slate-700 font-medium truncate">
                {proc.process_name}
              </div>
              <button
                onClick={() => handleDeleteProcess(proc.id)}
                className="text-slate-400 hover:text-rose-600 font-bold p-1 transition-colors"
                title="Remove process"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
