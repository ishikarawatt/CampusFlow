import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff } from 'lucide-react';
import { notifications as notifApi, errMsg } from '../api.js';
import { timeAgo } from '../utils.js';

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const boxRef = useRef(null);

  const load = async (silent = true) => {
    try {
      const { data } = await notifApi.list();
      setUnread(data.unread ?? 0);
      setItems(data.notifications ?? []);
    } catch (err) {
      if (!silent) console.error(errMsg(err));
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => {
      clearInterval(id);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  const markAllRead = async () => {
    try {
      await notifApi.readAll();
      setUnread(0);
      setItems((list) => list.map((n) => ({ ...n, is_read: true })));
    } catch (_) {}
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load(false);
        }}
        className="relative w-9 h-9 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--brand-accent)] hover:border-[var(--brand-accent)] transition-colors duration-150"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#9E3524] text-[#F7F3EA] text-[9px] font-mono font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-[var(--bg-surface)] rounded-[8px] border border-[var(--border-color)] shadow-panel z-50 overflow-hidden cf-transition">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-surface-elevated)]">
            <span className="font-serif font-bold text-[var(--text-primary)] text-sm">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-accent)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[380px] overflow-y-auto slim-scroll">
            {items.length === 0 ? (
              <div className="px-5 py-8 text-center text-[var(--text-muted)]">
                <BellOff className="w-7 h-7 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nothing yet. Test sessions and schedule updates will land here.</p>
              </div>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  to={n.link || '#'}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 border-b border-[var(--border-color)]/50 hover:bg-[var(--bg-subtle)] transition-colors ${
                    !n.is_read ? 'bg-[var(--brand-primary)]/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D9B36C] mt-1.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)]">
                        {n.title}
                      </div>
                      {n.body && (
                        <div className="text-[12px] text-[var(--text-muted)] mt-0.5 leading-snug">
                          {n.body}
                        </div>
                      )}
                      <div className="text-[10px] text-[var(--text-muted)]/80 mt-1 font-mono">
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
