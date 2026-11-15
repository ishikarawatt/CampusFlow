// Exam PCs Admin Page — hardware provisioning, PC allocation to students,
// session lifecycle control, and prohibited processes management.

import React, { useEffect, useState, useCallback } from 'react';
import { examMonitoring, resources as resourcesApi, users as usersApi, drives as drivesApi, errMsg } from '../../api';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import { useToast } from '../../components/Toast';
import { Cpu, PlusCircle, ShieldAlert, KeyRound, Monitor, CheckCircle, RefreshCw } from 'lucide-react';

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
      toast(errMsg(err, 'Failed to load exam PC data.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Computer
  const handleCreatePc = async (e) => {
    e.preventDefault();
    if (!newPcLabId || !newPcCode.trim()) {
      toast('Please choose a lab and specify a PC code.', 'error');
      return;
    }

    try {
      const res = await examMonitoring.createComputer({
        lab_resource_id: Number(newPcLabId),
        pc_code: newPcCode.trim().toUpperCase(),
      });

      setEnrollmentResult(res.data);
      toast(`Registered ${newPcCode.trim().toUpperCase()}!`, 'success');
      setShowAddPc(false);
      setNewPcLabId('');
      setNewPcCode('');
      loadData();
    } catch (err) {
      toast(errMsg(err, 'Failed to create computer.'), 'error');
    }
  };

  // Regenerate Enrollment Code
  const handleRegenerateCode = async (computerId) => {
    try {
      const res = await examMonitoring.regenerateEnrollment(computerId);
      setEnrollmentResult(res.data);
      toast('New enrollment code generated!', 'success');
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
      setAllocError('Please select both a PC and a student.');
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

  // End Session
  const handleEndSession = async (sessionId) => {
    try {
      await examMonitoring.endSession(sessionId);
      toast('Exam session ended. PC released to pool.', 'success');
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
      render: (r) => (
        <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
          {r.pc_code}
        </span>
      ),
    },
    {
      key: 'lab_name',
      label: 'Lab Resource',
      render: (r) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">{r.lab_name}</span>
      ),
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
      key: 'actions',
      label: 'Code Actions',
      render: (r) => (
        <button
          onClick={() => handleRegenerateCode(r.id)}
          className="text-xs font-mono font-semibold text-[#0F7B5F] dark:text-[#D9B36C] hover:underline"
        >
          Regenerate Code
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-mono text-[var(--text-muted)]">
          Loading exam terminal configuration…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Exam PC Provisioning"
        subtitle="Hardware registration, student terminal allocation, and proctoring process enforcement."
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Exams & Labs' },
          { label: 'Exam PCs' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddPc(true)}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Add Computer
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAllocate(true)}
              icon={<KeyRound className="w-4 h-4" />}
            >
              Allocate Student
            </Button>
          </div>
        }
      />

      {/* Enrollment Code Alert Box */}
      {enrollmentResult && (
        <div className="p-5 rounded-[10px] border border-[var(--border-gold)] bg-[var(--brand-accent)]/10 flex items-center justify-between gap-4 shadow-subtle">
          <div>
            <div className="font-serif font-bold text-sm text-[var(--text-primary)]">
              Terminal Provisioned: {enrollmentResult.pc_code}
            </div>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
              Enter this enrollment token during agent setup on the physical Windows PC:
            </p>
            <div className="mt-2.5 inline-flex items-center gap-2 bg-[var(--bg-surface)] px-3 py-1.5 rounded-[6px] border border-[var(--border-gold)]">
              <span className="font-mono text-sm font-bold text-[#D9B36C] select-all">
                {enrollmentResult.enrollment_code}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(enrollmentResult.enrollment_code);
                  toast('Enrollment code copied to clipboard!', 'info');
                }}
                className="text-xs font-mono font-semibold text-[#0F7B5F] dark:text-[#D9B36C] hover:underline"
              >
                Copy
              </button>
            </div>
          </div>
          <button
            onClick={() => setEnrollmentResult(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm font-bold p-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add Computer Modal */}
      {showAddPc && (
        <div className="fixed inset-0 z-50 bg-[#0B1F1A]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                Register New Exam PC
              </h3>
              <button
                onClick={() => setShowAddPc(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePc} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Computer Lab
                </label>
                <select
                  value={newPcLabId}
                  onChange={(e) => setNewPcLabId(e.target.value)}
                  className="w-full text-xs font-mono rounded-[6px] border border-[var(--border-color)] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-accent)]"
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
                <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  PC Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. LAB-A-PC06"
                  value={newPcCode}
                  onChange={(e) => setNewPcCode(e.target.value)}
                  className="w-full text-xs font-mono rounded-[6px] border border-[var(--border-color)] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-accent)]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddPc(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Generate Enrollment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Student Modal */}
      {showAllocate && (
        <div className="fixed inset-0 z-50 bg-[#0B1F1A]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                Allocate PC to Student
              </h3>
              <button
                onClick={() => setShowAllocate(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
              >
                ✕
              </button>
            </div>

            {allocError && (
              <div className="p-3 bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] text-[var(--status-danger-text)] rounded-[6px] text-xs font-mono">
                {allocError}
              </div>
            )}

            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Select Available PC
                </label>
                <select
                  value={allocPcId}
                  onChange={(e) => setAllocPcId(e.target.value)}
                  className="w-full text-xs font-mono rounded-[6px] border border-[var(--border-color)] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-accent)]"
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
                <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Select Student
                </label>
                <select
                  value={allocStudentId}
                  onChange={(e) => setAllocStudentId(e.target.value)}
                  className="w-full text-xs font-mono rounded-[6px] border border-[var(--border-color)] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-accent)]"
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
                <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Placement Drive (Optional)
                </label>
                <select
                  value={allocDriveId}
                  onChange={(e) => setAllocDriveId(e.target.value)}
                  className="w-full text-xs font-mono rounded-[6px] border border-[var(--border-color)] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-accent)]"
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
                <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Exam Window Keyword
                </label>
                <input
                  type="text"
                  value={allocKeyword}
                  onChange={(e) => setAllocKeyword(e.target.value)}
                  className="w-full text-xs font-mono rounded-[6px] border border-[var(--border-color)] px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-accent)]"
                  required
                />
                <p className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
                  Active foreground window title must contain this keyword.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAllocate(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Confirm Allocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Exam Sessions Section */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div>
            <h2 className="font-serif font-bold text-base text-[var(--text-primary)]">
              Current Exam Sessions
            </h2>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
              Allocated PCs with active or scheduled testing.
            </p>
          </div>
          <Badge variant="gold">{activeSessions.length} Assigned</Badge>
        </div>

        {activeSessions.length === 0 ? (
          <EmptyState
            title="No Active Allocations"
            message="No students are currently allocated to exam PCs. Use 'Allocate Student' to assign a terminal."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="py-2.5 px-3">PC Code</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Session Status</th>
                  <th className="py-2.5 px-3">Keyword</th>
                  <th className="py-2.5 px-3">Scheduled Start</th>
                  <th className="py-2.5 px-3 text-right">Session Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {activeSessions.map((session) => (
                  <tr key={session.session_id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-sm text-[var(--text-primary)]">
                      {session.pc_code}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-serif font-bold text-sm text-[var(--text-primary)]">
                        {session.student_name}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--text-muted)]">
                        Roll: {session.roll_no || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={session.session_status === 'active' ? 'success' : 'info'}>
                        {session.session_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <code className="text-xs font-mono bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-primary)]">
                        {session.exam_window_keyword}
                      </code>
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-[var(--text-muted)]">
                      {session.starts_at ? new Date(session.starts_at).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {session.session_status === 'scheduled' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStartSession(session.session_id)}
                        >
                          Start Exam
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleEndSession(session.session_id)}
                      >
                        End & Release
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Physical Computers Directory */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)]">
          <h2 className="font-serif font-bold text-base text-[var(--text-primary)]">
            Provisioned Lab Workstations
          </h2>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
            Physical machines registered across campus computer labs.
          </p>
        </div>

        <DataTable
          columns={pcColumns}
          rows={pcs}
          emptyHint="No computers enrolled yet. Click 'Add Computer' to register one."
        />
      </div>

      {/* Prohibited Processes Section */}
      <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div>
            <h2 className="font-serif font-bold text-base text-[var(--text-primary)]">
              Prohibited Background Processes
            </h2>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
              Processes restricted during examination sessions.
            </p>
          </div>

          <form onSubmit={handleAddProcess} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. discord.exe"
              value={newProcName}
              onChange={(e) => setNewProcName(e.target.value)}
              className="text-xs font-mono rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-1.5 focus:outline-none focus:border-[var(--brand-accent)]"
            />
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={submittingProc || !newProcName.trim()}
              loading={submittingProc}
            >
              Add Process
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {prohibited.map((proc) => (
            <div
              key={proc.id}
              className="flex items-center justify-between p-3 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-subtle)] text-xs font-mono"
            >
              <div className="text-[var(--text-primary)] font-medium truncate">
                {proc.process_name}
              </div>
              <button
                onClick={() => handleDeleteProcess(proc.id)}
                className="text-[var(--text-muted)] hover:text-[#9E3524] font-bold p-1 transition-colors"
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
