// Student Home — Campus Registrar Placement Register
// Replaces generic dashboard with an authoritative registrar desk:
// LedgerStrip, AdmitCard for upcoming appointments, Action Docket, and MarginNote.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { student as studentApi, drives as drivesApi, notifications as notificationsApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import { useAuth } from '../../auth.jsx';
import JourneyTimeline from '../../components/JourneyTimeline.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import Button from '../../components/Button.jsx';
import {
  LedgerStrip,
  AdmitCard,
  Docket,
  MarginNote,
  StampBadge,
} from '../../components/signature';
import { Calendar, Search, ArrowRight, ShieldCheck, Bell } from 'lucide-react';

export default function StudentDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState([]);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: j }, { data: open }, { data: n }, offersRes] = await Promise.all([
          studentApi.journey(),
          drivesApi.list({ status: 'open' }),
          notificationsApi.list().catch(() => ({ data: [] })),
          studentApi.getOffers().catch(() => ({ data: { offers: [] } })),
        ]);
        setJourney(j ?? []);
        setNotifs((n ?? []).slice(0, 5));
        setOffers(offersRes?.data?.offers ?? []);

        // Count eligible drives
        const appliedIds = new Set((j ?? []).map((x) => x.drive.id));
        const details = await Promise.all(
          (open ?? [])
            .filter((d) => !appliedIds.has(d.id))
            .map((d) => drivesApi.get(d.id).then((r) => r.data).catch(() => null))
        );
        setEligibleCount(details.filter((d) => d && d.eligibility?.eligible).length);
      } catch (err) {
        toast(errMsg(err, 'Could not load your student ledger.'), 'danger');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-[6px]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 rounded-[6px]" />
            <Skeleton className="h-64 rounded-[6px]" />
          </div>
          <Skeleton className="h-96 rounded-[6px]" />
        </div>
      </div>
    );
  }

  // Find soonest upcoming test or interview appointment
  const nextEvent = journey
    .flatMap((item) => {
      const events = [];
      if (item.testSession && !item.result) {
        events.push({
          type: 'test',
          title: `${item.drive.title} — Written Aptitude`,
          subtitle: item.drive.company,
          serial: `TST-${item.drive.id}-${item.testSession.id || '01'}`,
          date: formatDate(item.testSession.starts_at).split(',')[0],
          time: formatDate(item.testSession.starts_at).split(', ')[1],
          venue: item.testSession.venue ?? 'Assigned Terminal',
          driveId: item.drive.id,
        });
      }
      if (item.interview) {
        events.push({
          type: 'interview',
          title: `${item.drive.title} — Technical Interview`,
          subtitle: item.drive.company,
          serial: `INT-${item.drive.id}-${item.interview.id || '01'}`,
          date: item.interview.scheduled_date ? formatDate(item.interview.scheduled_date) : 'Scheduled',
          time: item.interview.time_slot ?? 'Designated Slot',
          venue: item.interview.room_number ?? 'Interview Chamber',
          driveId: item.drive.id,
        });
      }
      return events;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const activeJourney = journey.find(
    (item) => item.application.status !== 'rejected' && item.application.status !== 'withdrawn'
  );

  // Build Action Docket items
  const pendingOffers = offers.filter((o) => o.status === 'offered');
  const docketItems = [];

  if (pendingOffers.length > 0) {
    docketItems.push({
      id: 'offer-action',
      type: 'OFFER DECISION',
      typeVariant: 'gold',
      title: `${pendingOffers.length} Formal Placement Offer Awaiting Response`,
      description: `Package: ₹${pendingOffers[0].package_lpa} LPA from ${pendingOffers[0].company_name || 'Employer'}. Responses are irreversible.`,
      action: (
        <Button variant="primary" size="sm" onClick={() => navigate('/student/journey')}>
          Review Offer
        </Button>
      ),
    });
  }

  if (eligibleCount > 0) {
    docketItems.push({
      id: 'drives-action',
      type: 'MATCHED DRIVES',
      typeVariant: 'success',
      title: `${eligibleCount} Approved Campus Drives Matching Your Credentials`,
      description: 'Your CGPA and academic department meet the required eligibility threshold.',
      action: (
        <Button variant="outline" size="sm" onClick={() => navigate('/student/drives')}>
          Inspect Drives
        </Button>
      ),
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Archival Ledger Strip (replacing icon-in-square stat cards) */}
      <LedgerStrip
        items={[
          {
            label: 'RECORDED APPLICATIONS',
            value: journey.length,
            unit: 'Drives',
            subtext: `${journey.filter((j) => j.application.status === 'shortlisted').length} in active review`,
          },
          {
            label: 'ELIGIBLE MATCHES',
            value: eligibleCount,
            unit: 'Open',
            trend: eligibleCount > 0 ? 'up' : null,
            subtext: 'Meets academic threshold',
          },
          {
            label: 'FORMAL OFFERS',
            value: offers.length,
            unit: offers.some((o) => o.status === 'accepted') ? 'ACCEPTED' : 'Pending',
            trend: offers.length > 0 ? 'up' : null,
            badge: offers.some((o) => o.status === 'accepted') ? 'PLACED' : undefined,
            subtext: offers.length === 1 ? 'Single acceptance policy' : 'No offers recorded',
          },
          {
            label: 'DISPATCH NOTICES',
            value: notifs.length,
            unit: 'Unread',
            subtext: 'Registrar log alerts',
          },
        ]}
      />

      {/* 2. Asymmetric Central Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Primary Execution (AdmitCard + Action Docket + Active Stepper) */}
        <div className="lg:col-span-2 space-y-6">
          {/* AdmitCard for upcoming exam/interview appointment */}
          {nextEvent ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-midnight/60 dark:text-brandMuted">
                  SCHEDULED APPOINTMENT SLIP
                </span>
                <span className="text-xs font-mono text-emerald font-semibold">
                  MANDATORY ATTENDANCE
                </span>
              </div>
              <AdmitCard
                serialNumber={nextEvent.serial}
                title={nextEvent.title}
                subTitle={nextEvent.subtitle}
                date={nextEvent.date}
                time={nextEvent.time}
                venue={nextEvent.venue}
                status="CONFIRMED"
                statusLabel={nextEvent.type === 'test' ? 'HALL TICKET' : 'INTERVIEW SLIP'}
                statusVariant={nextEvent.type === 'test' ? 'gold' : 'success'}
                metaItems={[
                  { label: 'CANDIDATE ID', value: user?.registration_no || user?.id || 'CF-STU' },
                  { label: 'ADMISSION PROTOCOL', value: 'PHOTO ID REQD' },
                ]}
                actionSlot={
                  nextEvent.type === 'test' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/student/tests/${nextEvent.driveId}`)}
                    >
                      Enter Examination Console
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/student/journey')}
                    >
                      View Slot Details
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <div className="p-4 bg-[#FAF7F0] dark:bg-midnight-surface/50 border border-dashed border-[#D9CEBA] dark:border-midnight-border rounded-[6px] text-xs font-mono text-midnight/60 dark:text-brandMuted flex items-center justify-between">
              <span>No upcoming examination sessions scheduled for your registration ID.</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/drives')}>
                Browse Open Drives <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}

          {/* Action Docket: items requiring candidate decision */}
          {docketItems.length > 0 && (
            <Docket
              title="CANDIDATE ACTION DOCKET"
              subTitle="Immediate responses required by placement calendar"
              items={docketItems}
            />
          )}

          {/* Most Active Application Journey */}
          {activeJourney && (
            <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-5">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E0D0] dark:border-midnight-border">
                <div>
                  <span className="text-[10px] font-mono tracking-wider uppercase text-midnight/50 dark:text-brandMuted">
                    ACTIVE APPLICATION PROGRESSION
                  </span>
                  <h3 className="text-base font-serif font-bold text-midnight dark:text-ivory">
                    {activeJourney.drive.title} — {activeJourney.drive.company}
                  </h3>
                </div>
                <StampBadge
                  variant={
                    activeJourney.application.status === 'offered'
                      ? 'gold'
                      : activeJourney.application.status === 'shortlisted'
                      ? 'success'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {activeJourney.application.status.toUpperCase()}
                </StampBadge>
              </div>

              <JourneyTimeline
                driveTitle={activeJourney.drive.title}
                companyName={activeJourney.drive.company}
                packageLpa={activeJourney.drive.package_lpa}
                currentStage={activeJourney.application.status}
                stages={[
                  { label: 'Applied', status: 'done' },
                  {
                    label: 'Written Test',
                    status: activeJourney.testSession
                      ? activeJourney.result
                        ? 'done'
                        : 'current'
                      : 'pending',
                  },
                  { label: 'Score Published', status: activeJourney.result ? 'done' : 'pending' },
                  { label: 'Interview', status: activeJourney.interview ? 'current' : 'pending' },
                ]}
              />

              <div className="mt-4 pt-3 border-t border-[#EFE9DC] dark:border-midnight-border flex items-center justify-between text-xs">
                <span className="font-mono text-midnight/50 dark:text-brandMuted text-[11px]">
                  DRIVE REF: #{activeJourney.drive.id}
                </span>
                <Link
                  to="/student/journey"
                  className="text-emerald dark:text-emerald-light font-mono font-semibold hover:underline flex items-center gap-1"
                >
                  Inspect Full Journey Track <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: MarginNote & Official Dispatch Notices */}
        <div className="space-y-6">
          {/* Official Registrar Policy Notice */}
          <MarginNote
            title="REGISTRAR PLACEMENT REGULATIONS"
            variant="gold"
          >
            <p>
              <strong>Single Offer Policy:</strong> Once a formal placement offer is accepted by a candidate, all other applications are automatically withdrawn by institutional rule.
            </p>
            <p className="mt-1.5">
              <strong>Mandatory Test Protocol:</strong> Hall tickets must be presented along with a valid college photo ID. Terminals are locked to the CampusFlow Secure Kernel during exam windows.
            </p>
          </MarginNote>

          {/* Recent Registrar Dispatch Notices */}
          <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border overflow-hidden">
            <div className="px-4 py-3 bg-[#FAF7F0] dark:bg-midnight-dark border-b border-[#E8E0D0] dark:border-midnight-border flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider uppercase text-midnight/60 dark:text-brandMuted font-bold flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> OFFICIAL DISPATCH LOG
              </span>
              <span className="text-[10px] font-mono text-midnight/50 dark:text-brandMuted">
                LATEST 5
              </span>
            </div>

            <div className="divide-y divide-[#EFE9DC] dark:divide-midnight-border">
              {notifs.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-midnight/40 dark:text-brandMuted">
                  No unread administrative dispatch records.
                </div>
              ) : (
                notifs.map((n) => (
                  <div key={n.id} className="p-3.5 hover:bg-[#FAF7F0] dark:hover:bg-midnight/50 transition-colors">
                    <p className="text-xs text-midnight dark:text-ivory leading-snug">
                      {n.message ?? n.text ?? 'Registrar Notification'}
                    </p>
                    <span className="block text-[10px] font-mono text-midnight/50 dark:text-brandMuted mt-1">
                      {n.created_at ? formatDate(n.created_at) : 'Recorded'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State when zero applications */}
      {journey.length === 0 && eligibleCount === 0 && (
        <EmptyState
          title="Placement Register Clear"
          message="No active applications or scheduled examinations recorded. Consult the Approved Drives register to initiate recruitment."
          action={
            <Link to="/student/drives">
              <Button variant="primary">Access Drives Register</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
