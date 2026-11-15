// Student Journey — merges applications timeline, real offers management, application withdrawal.
// One timeline card per application: Applied > Test > Result > Interview > Offer.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { student as studentApi, bookings as bookingsApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import JourneyTimeline from '../../components/JourneyTimeline.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import Button from '../../components/Button.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { LedgerStrip, MarginNote } from '../../components/signature';

export default function StudentJourney() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState([]);
  const [offers, setOffers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');

  // Dialog states
  const [withdrawTarget, setWithdrawTarget] = useState(null); // appId
  const [acceptTarget, setAcceptTarget] = useState(null); // offer object
  const [declineTarget, setDeclineTarget] = useState(null); // offer object
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [{ data: historyRes }, { data: offersRes }, { data: bookingsRes }] = await Promise.all([
        studentApi.getHistory().catch(() => studentApi.journey()),
        studentApi.getOffers().catch(() => ({ data: { offers: [] } })),
        bookingsApi.mine().catch(() => ({ data: [] })),
      ]);

      const historyItems = historyRes?.history || historyRes || [];
      const offersList = offersRes?.offers || [];
      setJourney(historyItems);
      setOffers(offersList);
      setBookings(bookingsRes ?? []);
    } catch (err) {
      toast(errMsg(err, 'Could not load your journey.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Handlers: Withdraw Application
  // -------------------------------------------------------------------------
  const handleConfirmWithdraw = async () => {
    if (!withdrawTarget) return;
    try {
      setActionLoading(true);
      await studentApi.withdrawApplication(withdrawTarget);
      toast('Application withdrawn successfully.', 'success');
      setWithdrawTarget(null);
      await loadData();
    } catch (err) {
      toast(errMsg(err, 'Failed to withdraw application.'), 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handlers: Accept Offer
  // -------------------------------------------------------------------------
  const handleConfirmAccept = async () => {
    if (!acceptTarget) return;
    try {
      setActionLoading(true);
      const res = await studentApi.acceptOffer(acceptTarget.id);
      toast(res.data?.message || 'Offer accepted successfully! Congratulations!', 'success');
      setAcceptTarget(null);
      await loadData();
    } catch (err) {
      toast(errMsg(err, 'Failed to accept offer.'), 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handlers: Decline Offer
  // -------------------------------------------------------------------------
  const handleConfirmDecline = async () => {
    if (!declineTarget) return;
    try {
      setActionLoading(true);
      await studentApi.declineOffer(declineTarget.id);
      toast('Offer declined.', 'info');
      setDeclineTarget(null);
      await loadData();
    } catch (err) {
      toast(errMsg(err, 'Failed to decline offer.'), 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <Skeleton className="h-48 w-full rounded-[10px]" />
        <Skeleton className="h-48 w-full rounded-[10px]" />
      </div>
    );
  }

  const filteredJourney = journey.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const driveTitle = item.drive?.title || '';
    const company = item.company?.name || item.drive?.company || '';
    return driveTitle.toLowerCase().includes(q) || company.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Journey"
        subtitle="Track every application from applied to offer. All test sessions, results, interviews, and placement offers appear here."
        breadcrumbs={[
          { label: 'Student', to: '/student' },
          { label: 'My Journey' },
        ]}
      />

      <LedgerStrip
        items={[
          { label: 'APPLICATIONS', value: journey.length, unit: 'Registered' },
          {
            label: 'SHORTLISTED',
            value: journey.filter((j) => j.application?.status === 'shortlisted').length,
            unit: 'Active',
          },
          {
            label: 'FORMAL OFFERS',
            value: offers.length,
            unit: offers.some((o) => o.status === 'accepted') ? 'ACCEPTED' : 'Pending',
            trend: offers.length > 0 ? 'up' : null,
          },
          {
            label: 'WITHDRAWN',
            value: journey.filter((j) => j.application?.status === 'withdrawn').length,
            unit: 'Archived',
          },
        ]}
      />

      <MarginNote title="INSTITUTIONAL PLACEMENT REGULATION" variant="gold">
        Placement offers extended through CampusFlow are binding once accepted. Acceptance of any offer triggers automatic institutional withdrawal of all other pending applications pursuant to the placement office guidelines.
      </MarginNote>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by drive or company..."
      />

      {filteredJourney.length === 0 ? (
        <EmptyState
          title={search ? 'No matching applications' : 'No applications yet'}
          message={
            search
              ? 'Try a different search term.'
              : 'Apply to a placement drive to track everything here: test scheduling, results, interview slots, and official job offers.'
          }
          action={
            !search && (
              <Link to="/student/drives">
                <Button variant="primary">Browse Active Drives</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredJourney.map((item) => {
            const appId = item.application_id || item.application?.id;
            const appStatus = item.status || item.application?.status;
            const appliedAt = item.applied_at || item.application?.applied_at;

            // Find matching offer
            const matchedOffer =
              item.offer ||
              offers.find(
                (o) =>
                  o.application_id === appId ||
                  (o.drive_id === item.drive_id && o.drive_id === item.drive?.id)
              ) ||
              null;

            const stages = [
              {
                label: 'Applied',
                status: 'done',
                detail: appliedAt ? formatDate(appliedAt).split(',')[0] : 'Done',
              },
              {
                label: 'Test',
                status:
                  item.test_result || item.result
                    ? 'done'
                    : item.test_slot || item.testSession
                    ? 'current'
                    : 'pending',
                detail:
                  item.test_slot?.slot_title ||
                  item.testSession?.title ||
                  (item.drive?.status === 'open' ? 'Scheduled automatically' : 'Pending'),
              },
              {
                label: 'Result',
                status: item.test_result || item.result ? 'done' : 'pending',
                detail:
                  item.test_result || item.result
                    ? `${Number(item.test_result?.percentage ?? item.result?.percentage).toFixed(1)}%`
                    : 'Pending',
              },
              {
                label: 'Interview',
                status:
                  item.interview
                    ? 'current'
                    : appStatus === 'shortlisted' || appStatus === 'selected'
                    ? 'current'
                    : 'pending',
                detail: item.interview
                  ? `${formatDate(item.interview.starts_at).split(',')[0]}${
                      item.interview.venue ? ` · ${item.interview.venue}` : ''
                    }`
                  : appStatus === 'shortlisted'
                  ? 'Shortlisted'
                  : 'Pending',
              },
            ];

            const canWithdraw = appStatus === 'applied' || appStatus === 'test_taken';

            return (
              <JourneyTimeline
                key={appId}
                applicationId={appId}
                driveTitle={item.drive?.title}
                companyName={item.company?.name || item.drive?.company}
                packageLpa={item.package_lpa || item.drive?.package_lpa}
                currentStage={appStatus}
                stages={stages}
                offer={matchedOffer}
                canWithdraw={canWithdraw}
                onWithdrawApplication={(id) => setWithdrawTarget(id)}
                onAcceptOffer={(offer) => setAcceptTarget(offer)}
                onDeclineOffer={(offer) => setDeclineTarget(offer)}
              />
            );
          })}
        </div>
      )}

      {/* Upcoming schedule from bookings */}
      {bookings.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-serif font-bold text-[var(--text-primary)] mb-4">
            Confirmed Sessions & Venue Details
          </h3>
          <div className="space-y-2">
            {bookings
              .filter((b) => new Date(b.slot.starts_at).getTime() >= Date.now())
              .sort((a, b) => new Date(a.slot.starts_at) - new Date(b.slot.starts_at))
              .map((b) => (
                <div
                  key={b.id}
                  className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-4 flex items-center gap-4 shadow-subtle"
                >
                  <div
                    className={`w-10 h-10 rounded-[6px] flex items-center justify-center text-lg shrink-0 ${
                      b.slot.type === 'test'
                        ? 'bg-[var(--status-info-bg)] text-[#0F7B5F]'
                        : 'bg-[var(--status-success-bg)] text-[#0F7B5F]'
                    }`}
                  >
                    {b.slot.type === 'test' ? '📝' : '🎤'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-[var(--text-primary)] truncate">
                      {b.slot.title}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                      {formatDate(b.slot.starts_at)} → {formatDate(b.slot.ends_at)}
                    </div>
                  </div>
                  {b.slot.type === 'test' && (
                    <Link to={`/student/tests/${b.slot.drive_id}`}>
                      <Button variant="primary" size="sm">
                        Take Test
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Dialog: Withdraw Application */}
      <ConfirmDialog
        open={!!withdrawTarget}
        title="Withdraw Application?"
        message="Are you sure you want to withdraw this application? This action notifies the recruiter and cannot be undone."
        confirmLabel="Withdraw Application"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleConfirmWithdraw}
        onCancel={() => setWithdrawTarget(null)}
      />

      {/* Dialog: Accept Placement Offer */}
      <ConfirmDialog
        open={!!acceptTarget}
        title="Accept Formal Placement Offer? 🎉"
        message={`Accepting this offer (${acceptTarget?.package_lpa} LPA) will mark your application as Selected and locks you into this offer. Per campus placement regulations, you can only accept one placement offer.`}
        confirmLabel="Accept & Confirm"
        variant="primary"
        loading={actionLoading}
        onConfirm={handleConfirmAccept}
        onCancel={() => setAcceptTarget(null)}
      />

      {/* Dialog: Decline Placement Offer */}
      <ConfirmDialog
        open={!!declineTarget}
        title="Decline Placement Offer?"
        message="Are you sure you want to decline this job offer? The recruiter will be notified and this offer will be archived."
        confirmLabel="Decline Offer"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleConfirmDecline}
        onCancel={() => setDeclineTarget(null)}
      />
    </div>
  );
}
