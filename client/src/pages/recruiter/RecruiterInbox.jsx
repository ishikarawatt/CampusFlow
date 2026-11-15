// Recruiter Inbox — Institutional Dispatch & Candidate Event Activity Stream
// Upgraded to Campus Registrar visual language:
// Ruled ledger stream with unread markers, mono timestamps, and StampBadge categories.

import React, { useEffect, useState } from 'react';
import { notifications as notifApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { StampBadge, MarginNote } from '../../components/signature';
import { Mail, CheckCheck, Bell } from 'lucide-react';

export default function RecruiterInbox() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [marking, setMarking] = useState(false);

  const load = async () => {
    try {
      const { data } = await notifApi.list();
      const notifs = data?.notifications ?? (Array.isArray(data) ? data : []);
      setItems(notifs);
    } catch (err) {
      toast(errMsg(err, 'Could not load messages.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await notifApi.readAll();
      setItems((prev) => prev.map((it) => ({ ...it, is_read: true })));
      toast('All messages marked as read.', 'success');
    } catch (err) {
      toast(errMsg(err, 'Failed to update messages.'), 'danger');
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-16 w-full rounded-[6px]" />
        <Skeleton className="h-48 w-full rounded-[6px]" />
      </div>
    );
  }

  const unreadCount = items.filter((it) => !it.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Registrar Dispatch Inbox"
        subtitle="Live announcements, exam completions, and candidate milestone alerts."
        breadcrumbs={[
          { label: 'Recruiter', to: '/recruiter' },
          { label: 'Inbox' },
        ]}
        actions={
          unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              loading={marking}
              onClick={markAllRead}
              icon={<CheckCheck className="w-4 h-4" />}
            >
              Mark all read
            </Button>
          )
        }
      />

      <MarginNote title="INSTITUTIONAL EVENT LOG" variant="neutral">
        Automated telemetry logs and applicant submission notices are permanently archived in the Placement Office ledger. Unread notices are indicated by amber status pins.
      </MarginNote>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#FAF7F0] dark:bg-midnight border border-[#D9CEBA] dark:border-midnight-border flex items-center justify-center text-midnight/50 dark:text-brandMuted mx-auto">
            <Bell className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-base text-midnight dark:text-ivory">
            Dispatch Log Empty
          </h3>
          <p className="text-xs font-mono text-midnight/60 dark:text-brandMuted max-w-md mx-auto">
            No pipeline events recorded. Automated notices will arrive as candidates submit answers, attend interviews, or accept formal offers.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border overflow-hidden">
          <div className="px-4 py-2.5 bg-[#FAF7F0] dark:bg-midnight-dark border-b border-[#E8E0D0] dark:border-midnight-border flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] uppercase tracking-wider text-midnight/60 dark:text-brandMuted font-bold">
              OFFICIAL DISPATCH STREAM ({items.length} RECORDS)
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
              {unreadCount} UNREAD
            </span>
          </div>

          <div className="divide-y divide-[#EFE9DC] dark:divide-midnight-border">
            {items.map((it) => {
              const isUnread = !it.is_read;
              const type = (it.type || 'NOTICE').toUpperCase();
              let stampVariant = 'neutral';
              if (type.includes('OFFER') || type.includes('SELECT')) stampVariant = 'gold';
              else if (type.includes('TEST') || type.includes('APPLY')) stampVariant = 'success';
              else if (type.includes('ALERT') || type.includes('REJECT')) stampVariant = 'danger';

              return (
                <div
                  key={it.id}
                  className={`p-4 flex items-start gap-4 transition-colors ${
                    isUnread ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'hover:bg-[#FAF7F0] dark:hover:bg-midnight/50'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {isUnread ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block ring-2 ring-amber-400/30"></span>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-midnight-border block"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StampBadge variant={stampVariant} size="sm">
                        {type}
                      </StampBadge>
                      <span className="text-[11px] font-mono text-midnight/50 dark:text-brandMuted">
                        {it.created_at ? formatDate(it.created_at) : 'Recorded'}
                      </span>
                    </div>
                    <p className="text-sm font-serif text-midnight dark:text-ivory leading-snug">
                      {it.title || it.message || it.text || 'Placement Notice'}
                    </p>
                    {it.details && (
                      <p className="text-xs text-midnight/70 dark:text-brandMuted font-mono">
                        {it.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
