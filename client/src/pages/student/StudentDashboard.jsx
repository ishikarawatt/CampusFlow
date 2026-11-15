// Student Home — "What do I do next?" landing page.
// Next-up card, active journey stepper, matching drives, latest notifications.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { student as studentApi, drives as drivesApi, notifications as notificationsApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import { useAuth } from '../../auth.jsx';
import NextUpCard from '../../components/NextUpCard.jsx';
import JourneyTimeline from '../../components/JourneyTimeline.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import Button from '../../components/Button.jsx';
import StatCard from '../../components/StatCard.jsx';
import { Briefcase, Map, ClipboardList, Bell } from 'lucide-react';

export default function StudentDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState([]);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: j }, { data: open }, { data: n }] = await Promise.all([
          studentApi.journey(),
          drivesApi.list({ status: 'open' }),
          notificationsApi.list().catch(() => ({ data: [] })),
        ]);
        setJourney(j ?? []);
        setNotifs((n ?? []).slice(0, 5));
        // Count eligible drives
        const appliedIds = new Set((j ?? []).map((x) => x.drive.id));
        const details = await Promise.all(
          open.filter((d) => !appliedIds.has(d.id))
            .map((d) => drivesApi.get(d.id).then((r) => r.data).catch(() => null))
        );
        setEligibleCount(details.filter((d) => d && d.eligibility?.eligible).length);
      } catch (err) {
        toast(errMsg(err, 'Could not load your dashboard.'), 'error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-[10px]" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-[10px]" />
          <Skeleton className="h-24 rounded-[10px]" />
          <Skeleton className="h-24 rounded-[10px]" />
        </div>
        <Skeleton className="h-48 rounded-[10px]" />
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  // Find the soonest upcoming event (test or interview)
  const nextEvent = journey
    .flatMap((item) => {
      const events = [];
      if (item.testSession && !item.result) {
        events.push({
          type: 'test',
          title: `${item.drive.title} — Aptitude Test`,
          subtitle: item.drive.company,
          date: formatDate(item.testSession.starts_at).split(',')[0],
          time: formatDate(item.testSession.starts_at).split(', ')[1],
          venue: item.testSession.venue ?? item.testSession.title,
          actionLabel: 'Take test',
          onAction: () => navigate(`/student/tests/${item.drive.id}`),
          ts: new Date(item.testSession.starts_at).getTime(),
        });
      }
      if (item.interview) {
        events.push({
          type: 'interview',
          title: `${item.drive.title} — Interview`,
          subtitle: item.drive.company,
          date: formatDate(item.interview.starts_at).split(',')[0],
          time: formatDate(item.interview.starts_at).split(', ')[1],
          venue: item.interview.venue ?? 'TBA',
          ts: new Date(item.interview.starts_at).getTime(),
        });
      }
      return events;
    })
    .filter((e) => e.ts >= Date.now())
    .sort((a, b) => a.ts - b.ts)[0];

  // Most active application (most recent stage)
  const activeJourney = journey.length > 0 ? journey[0] : null;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
          Hey {firstName} 👋
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {journey.length === 0
            ? "No applications yet. Find a drive you're eligible for and apply in one click."
            : `You have ${journey.length} active application${journey.length !== 1 ? 's' : ''}. Here's what's next.`}
        </p>
      </div>

      {/* Next Up Card */}
      {nextEvent ? (
        <NextUpCard
          title={nextEvent.title}
          subtitle={nextEvent.subtitle}
          date={nextEvent.date}
          time={nextEvent.time}
          venue={nextEvent.venue}
          actionLabel={nextEvent.actionLabel}
          onAction={nextEvent.onAction}
        />
      ) : journey.length === 0 ? (
        <NextUpCard
          title={eligibleCount > 0 ? `${eligibleCount} drives match your profile` : 'Complete your profile'}
          subtitle={eligibleCount > 0 ? 'Browse eligible drives and apply in one click' : 'Set up your academic details for drive matching'}
          actionLabel={eligibleCount > 0 ? 'Browse drives' : 'Go to profile'}
          onAction={() => navigate(eligibleCount > 0 ? '/student/drives' : '/student/profile')}
        />
      ) : null}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Active Applications" value={journey.length} icon={<ClipboardList className="w-5 h-5" />} />
        <StatCard label="Matching Drives" value={eligibleCount} icon={<Briefcase className="w-5 h-5" />} />
        <StatCard label="Notifications" value={notifs.length} icon={<Bell className="w-5 h-5" />} />
      </div>

      {/* Active Journey Stepper */}
      {activeJourney && (
        <div>
          <h3 className="text-sm font-serif font-bold text-[var(--text-primary)] mb-3">Most Active Application</h3>
          <JourneyTimeline
            driveTitle={activeJourney.drive.title}
            companyName={activeJourney.drive.company}
            packageLpa={activeJourney.drive.package_lpa}
            currentStage={activeJourney.application.status}
            stages={[
              { label: 'Applied', status: 'done' },
              { label: 'Test', status: activeJourney.testSession ? (activeJourney.result ? 'done' : 'current') : 'pending' },
              { label: 'Result', status: activeJourney.result ? 'done' : 'pending' },
              { label: 'Interview', status: activeJourney.interview ? 'current' : 'pending' },
            ]}
          />
        </div>
      )}

      {/* Matching Drives */}
      {eligibleCount > 0 && (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-serif font-bold text-[var(--text-primary)]">Matching Drives</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{eligibleCount} open drives match your profile</p>
            </div>
            <Link to="/student/drives">
              <Button variant="primary" size="sm">View all</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      {notifs.length > 0 && (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-serif font-bold text-[var(--text-primary)]">Latest Notifications</h3>
          </div>
          <ul className="divide-y divide-[var(--border-color)]">
            {notifs.map((n) => (
              <li key={n.id} className="px-5 py-3 text-sm text-[var(--text-secondary)]">
                {n.message ?? n.text ?? 'Notification'}
                <span className="block text-xs text-[var(--text-muted)] font-mono mt-0.5">
                  {n.created_at ? formatDate(n.created_at) : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {journey.length === 0 && eligibleCount === 0 && (
        <EmptyState
          title="No applications yet"
          message="Apply to a drive and track everything here: your test venue and time, your result, and your interview slot."
          action={<Link to="/student/drives"><Button variant="primary">Browse drives</Button></Link>}
        />
      )}
    </div>
  );
}
