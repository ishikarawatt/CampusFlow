import React from 'react';
import Button from './Button';
import { Calendar, Clock, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function NextUpCard({
  title,
  subtitle,
  date,
  time,
  venue,
  actionLabel,
  onAction,
  status = 'upcoming',
}) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-gold)] p-6 shadow-subtle relative overflow-hidden group">
      {/* Signature top gold accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D9B36C]" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-[#D9B36C]/15 border border-[#D9B36C]/40 text-xs font-mono font-bold text-[var(--text-primary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9B36C] cf-live-pulse" />
            <span>NEXT UP ON YOUR SCHEDULE</span>
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">
                {subtitle}
              </p>
            )}
          </div>

          {/* Details strip */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--text-secondary)] pt-1">
            {date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D9B36C]" />
                <span>{date}</span>
              </div>
            )}
            {time && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#D9B36C]" />
                <span>{time}</span>
              </div>
            )}
            {venue && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D9B36C]" />
                <span>{venue}</span>
              </div>
            )}
          </div>
        </div>

        {actionLabel && (
          <div className="shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={onAction}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

