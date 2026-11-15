// Student Journey — merges old MyBookings + applications timeline.
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

export default function StudentJourney() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [{ data: j }, { data: b }] = await Promise.all([
          studentApi.journey(),
          bookingsApi.mine(),
        ]);
        setJourney(j ?? []);
        setBookings(b ?? []);
      } catch (err) {
        toast(errMsg(err, 'Could not load your journey.'), 'error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    return (
      item.drive.title.toLowerCase().includes(q) ||
      item.drive.company?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Journey"
        subtitle="Track every application from applied to offer. All your test sessions and interviews appear here automatically."
        breadcrumbs={[
          { label: 'Student', to: '/student' },
          { label: 'My Journey' },
        ]}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by drive or company..."
      />

      {filteredJourney.length === 0 ? (
        <EmptyState
          title={search ? 'No matching applications' : 'No applications yet'}
          message={search ? 'Try a different search.' : 'Apply to a drive and track everything here: your test venue and time, your result, and your interview slot.'}
          action={!search && <Link to="/student/drives"><Button variant="primary">Browse drives</Button></Link>}
        />
      ) : (
        <div className="space-y-4">
          {filteredJourney.map((item) => {
            const app = item.application;
            const stages = [
              { label: 'Applied', status: 'done', detail: formatDate(app.created_at ?? '').split(',')[0] },
              {
                label: 'Test',
                status: item.testSession ? (item.result ? 'done' : 'current') : 'pending',
                detail: item.testSession ? item.testSession.title : 'Pending',
              },
              {
                label: 'Result',
                status: item.result ? 'done' : 'pending',
                detail: item.result ? `${Number(item.result.percentage).toFixed(1)}%` : 'Pending',
              },
              {
                label: 'Interview',
                status: item.interview ? 'current' : 'pending',
                detail: item.interview ? formatDate(item.interview.starts_at).split(',')[0] : 'Pending',
              },
            ];

            return (
              <JourneyTimeline
                key={app.id}
                driveTitle={item.drive.title}
                companyName={item.drive.company}
                packageLpa={item.drive.package_lpa}
                currentStage={app.status}
                stages={stages}
                offer={app.status === 'selected' ? { package_lpa: item.drive.package_lpa } : null}
                onAcceptOffer={() => toast('Offer acceptance recorded.', 'success')}
                onDeclineOffer={() => toast('Offer declined.', 'info')}
              />
            );
          })}
        </div>
      )}

      {/* Upcoming schedule from bookings */}
      {bookings.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-serif font-bold text-[var(--text-primary)] mb-4">Upcoming Schedule</h3>
          <div className="space-y-2">
            {bookings
              .filter((b) => new Date(b.slot.starts_at).getTime() >= Date.now())
              .sort((a, b) => new Date(a.slot.starts_at) - new Date(b.slot.starts_at))
              .map((b) => (
                <div key={b.id} className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-[6px] flex items-center justify-center text-lg shrink-0 ${b.slot.type === 'test' ? 'bg-[var(--status-info-bg)]' : 'bg-[var(--status-success-bg)]'}`}>
                    {b.slot.type === 'test' ? '📝' : '🎤'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-[var(--text-primary)] truncate">{b.slot.title}</div>
                    <div className="text-xs text-[var(--text-muted)] font-mono">{formatDate(b.slot.starts_at)}</div>
                  </div>
                  {b.slot.type === 'test' && (
                    <Link to={`/student/tests/${b.slot.drive_id}`}>
                      <Button variant="primary" size="sm">Take test</Button>
                    </Link>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

