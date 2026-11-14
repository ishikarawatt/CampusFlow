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
        className="relative w-10 h-10 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[#26BFD0] hover:border-[#26BFD0]/40 transition-colors duration-150"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[380px] max-w-[90vw] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xl z-50 overflow-hidden cf-rise">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
            <span className="font-bold text-[var(--color-text-primary)] text-sm">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-[#26BFD0] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto slim-scroll">
            {items.length === 0 ? (
              <div className="px-5 py-10 text-center text-[var(--color-text-muted)]">
                <BellOff className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]/60" />
                <p className="text-sm">Nothing yet. Test sessions, results and interview schedules will land here.</p>
              </div>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  to={n.link || '#'}
                  onClick={() => setOpen(false)}
                  className={`block px-5 py-3.5 border-b border-[var(--color-border)]/60 hover:bg-[var(--color-bg)]/80 transition-colors ${
                    !n.is_read ? 'bg-[#26BFD0]/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#26BFD0] mt-1.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {n.title}
                      </div>
                      {n.body && (
                        <div className="text-[13px] text-[var(--color-text-muted)] mt-0.5 leading-snug">
                          {n.body}
                        </div>
                      )}
                      <div className="text-[11px] text-[var(--color-text-muted)]/80 mt-1 font-mono">
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
