// Recruiter Inbox — Dedicated notification & candidate event activity stream.

import React, { useEffect, useState } from 'react';
import { notifications as notifApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Mail, CheckCheck, BellRing, Sparkles } from 'lucide-react';

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
      toast(errMsg(err, 'Could not load messages.'), 'error');
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
      toast(errMsg(err, 'Failed to update messages.'), 'error');
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <Skeleton className="h-48 w-full rounded-[10px]" />
      </div>
    );
  }

  const unreadCount = items.filter((it) => !it.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Inbox"
        subtitle="Live announcements, interview schedules, and applicant event updates."
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

      {items.length === 0 ? (
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-6 shadow-subtle">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#0F7B5F]/15 border border-[#0F7B5F]/30 flex items-center justify-center text-[#0F7B5F] shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                  Recruiter Activity Stream Active
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Real-time pipeline notifications will appear here as students apply, complete tests, and attend interviews.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-[6px] border border-[var(--border-gold)] bg-[var(--brand-accent)]/10 text-xs text-[var(--text-secondary)] font-mono flex items-start gap-2.5 mt-4">
              <Sparkles className="w-4 h-4 text-[#D9B36C] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--text-primary)] block mb-0.5">Automated Event Tracking Enabled</span>
                When students take their aptitude tests or interview panels are generated, you will receive instant notifications in this feed and via the navigation bell.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
          <ul className="divide-y divide-[var(--border-color)]">
            {items.map((it) => {
              const isUnread = !it.is_read;
              return (
                <li
                  key={it.id}
                  className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                    isUnread ? 'bg-[var(--brand-accent)]/10' : 'hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0 ${
                      isUnread
                        ? 'bg-[#D9B36C] text-[#0B1F1A]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm ${
                          isUnread
                            ? 'font-bold text-[var(--text-primary)] font-serif'
                            : 'font-medium text-[var(--text-secondary)] font-serif'
                        }`}
                      >
                        {it.title || 'System Notification'}
                      </p>
                      <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">
                        {it.created_at ? formatDate(it.created_at) : 'Recent'}
                      </span>
                    </div>
                    {it.body && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans leading-relaxed">
                        {it.body}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
