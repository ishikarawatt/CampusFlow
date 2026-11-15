// Recruiter Inbox — dedicated notifications & application event activity stream.

import React, { useEffect, useState } from 'react';
import { notifications as notifApi, errMsg } from '../../api.js';
import { formatDate } from '../../utils.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Mail, CheckCheck } from 'lucide-react';

export default function RecruiterInbox() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [marking, setMarking] = useState(false);

  const load = async () => {
    try {
      const { data } = await notifApi.list();
      setItems(data ?? []);
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
      setItems((prev) => prev.map((it) => ({ ...it, read: true, is_read: 1 })));
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

  const unreadCount = items.filter((it) => !it.read && !it.is_read).length;

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
        <EmptyState
          title="Your inbox is empty"
          message="System notifications regarding drive registrations and tests will appear here."
        />
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
          <ul className="divide-y divide-[var(--border-color)]">
            {items.map((it) => {
              const isUnread = !it.read && !it.is_read;
              return (
                <li
                  key={it.id}
                  className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                    isUnread ? 'bg-[var(--brand-accent)]/5' : 'hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0 ${
                      isUnread
                        ? 'bg-[#D9B36C] text-[#0B1F1A]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm ${
                          isUnread
                            ? 'font-bold text-[var(--text-primary)]'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {it.message ?? it.title ?? it.text ?? 'System notification'}
                      </p>
                      <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">
                        {it.created_at ? formatDate(it.created_at) : 'Just now'}
                      </span>
                    </div>
                    {it.detail && (
                      <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">{it.detail}</p>
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
