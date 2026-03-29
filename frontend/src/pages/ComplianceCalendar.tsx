import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, CalendarDays, Clock, AlertTriangle, CheckCircle2, Shield,
  ChevronLeft, ChevronRight, Bell, FileText, Award, Users, Filter,
  Sparkles, Target, TrendingUp, Zap, AlertCircle, RefreshCw
} from 'lucide-react';
import { useComplianceCalendar } from '../api/hooks/useAPIHooks';
import type { ComplianceCalendarEventRecord } from '../api/services/apiService';

type EventType = 'audit' | 'certification' | 'inspection' | 'training' | 'regulatory' | 'renewal';

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  type: EventType;
  status: 'upcoming' | 'overdue' | 'completed' | 'in-progress';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  regulation?: string;
  daysLeft?: number;
}

const typeConfig: Record<EventType, { icon: any; color: string; label: string }> = {
  audit: { icon: Shield, color: 'cyan', label: 'Audit' },
  certification: { icon: Award, color: 'purple', label: 'Certification' },
  inspection: { icon: FileText, color: 'blue', label: 'Inspection' },
  training: { icon: Users, color: 'amber', label: 'Training' },
  regulatory: { icon: AlertTriangle, color: 'red', label: 'Regulatory' },
  renewal: { icon: RefreshCw, color: 'green', label: 'Renewal' },
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  'upcoming': { bg: 'bg-accent/10', text: 'text-accent', label: 'Upcoming' },
  'overdue': { bg: 'bg-danger/10', text: 'text-danger', label: 'Overdue' },
  'completed': { bg: 'bg-success/10', text: 'text-success', label: 'Completed' },
  'in-progress': { bg: 'bg-warning/10', text: 'text-warning', label: 'In Progress' },
};

const priorityConfig: Record<string, { dot: string }> = {
  high: { dot: 'bg-danger' },
  medium: { dot: 'bg-warning' },
  low: { dot: 'bg-text-muted' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const ComplianceCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(1); // Feb (0-indexed)
  const [currentYear] = useState(2026);
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ── Real API Data ──────────────────────────────────────────────────────────
  const { data: backendEvents } = useComplianceCalendar({ year: String(currentYear), month: String(currentMonth + 1) });

  const allEvents = useMemo<CalendarEvent[]>(() => {
    return (backendEvents ?? []).map((e: ComplianceCalendarEventRecord) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      type: e.type,
      status: e.status,
      priority: e.priority,
      assignee: e.assignee,
      regulation: e.regulation,
      daysLeft: e.daysLeft,
    }));
  }, [backendEvents]);

  const filteredEvents = filterType === 'all'
    ? allEvents
    : allEvents.filter(e => e.type === filterType);

  const overdueCount = allEvents.filter(e => e.status === 'overdue').length;
  const upcomingCount = allEvents.filter(e => e.status === 'upcoming').length;
  const completedCount = allEvents.filter(e => e.status === 'completed').length;

  // Generate calendar days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allEvents.filter(e => e.date === dateStr);
  };

  const navigateMonth = (dir: number) => {
    setCurrentMonth(prev => {
      const nm = prev + dir;
      if (nm < 0) return 11;
      if (nm > 11) return 0;
      return nm;
    });
    setSelectedDate(null);
  };

  return (
    <div className="page-wrapper">



      <main className="relative z-10 max-w-7xl mx-auto pt-8 px-5 md:px-8 lg:px-12 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
              <CalendarDays className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-[0.3em]">
                <Shield className="w-3 h-3" /> Compliance Management
              </div>
              <h1 className="page-title">Compliance Calendar</h1>
            </div>
          </div>
          <p className="text-sm text-text-muted max-w-2xl">
            Track audit schedules, certification renewals, regulatory deadlines, and training expirations in one unified compliance timeline.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
          {[
            { label: 'Overdue', value: overdueCount, icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' },
            { label: 'Upcoming', value: upcomingCount, icon: Clock, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
            { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`p-4 rounded-2xl bg-surface-overlay border ${stat.border}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">{stat.label}</span>
              </div>
              <p className={`text-2xl font-black font-display ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filterType === 'all' ? 'bg-accent/10 text-accent border border-accent/30' : 'text-text-muted border border-surface-border'}`}
          >All</button>
          {Object.entries(typeConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilterType(key as EventType)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                filterType === key ? 'bg-accent/10 text-accent border border-accent/30' : 'text-text-muted border border-surface-border'
              }`}
            >
              <config.icon className="w-3 h-3" />
              {config.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3 p-5 rounded-2xl bg-surface-raised border border-accent/15">
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg hover:bg-surface-overlay transition-colors">
                <ChevronLeft className="w-5 h-5 text-text-muted" />
              </button>
              <h3 className="text-lg font-bold text-text-primary font-display">{MONTHS[currentMonth]} {currentYear}</h3>
              <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-surface-overlay transition-colors">
                <ChevronRight className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] text-text-muted font-bold uppercase tracking-wider py-2">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
                const dayEvents = getEventsForDay(day);
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = day === 18 && currentMonth === 1;
                const isSelected = selectedDate === dateStr;
                const hasOverdue = dayEvents.some(e => e.status === 'overdue');
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                      isSelected ? 'bg-accent/20 border border-accent/40' :
                      isToday ? 'bg-accent/10 border border-accent/20' :
                      dayEvents.length > 0 ? 'bg-surface-sunken hover:bg-surface-overlay border border-surface-border' :
                      'hover:bg-surface-overlay/30 border border-transparent'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isToday ? 'text-accent' : isSelected ? 'text-text-primary' : 'text-text-muted'}`}>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((ev, idx) => (
                          <div key={idx} className={`w-1.5 h-1.5 rounded-full ${hasOverdue ? 'bg-danger' : 'bg-accent'}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event List */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" />
              {selectedDate ? `Events for ${new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'All Compliance Events'}
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-hide">
              {(selectedDate ? filteredEvents.filter(e => e.date === selectedDate) : filteredEvents)
                .sort((a, b) => {
                  if (a.status === 'overdue' && b.status !== 'overdue') return -1;
                  if (b.status === 'overdue' && a.status !== 'overdue') return 1;
                  return a.date.localeCompare(b.date);
                })
                .map((event, i) => {
                  const tc = typeConfig[event.type];
                  const sc = statusConfig[event.status];
                  const pc = priorityConfig[event.priority];
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-4 rounded-xl bg-surface-raised border ${event.status === 'overdue' ? 'border-danger/30' : 'border-surface-border'} hover:border-accent/20 transition-all`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${event.status === 'overdue' ? 'bg-danger/10' : 'bg-surface-sunken'}`}>
                          <tc.icon className={`w-4 h-4 ${event.status === 'overdue' ? 'text-danger' : 'text-accent'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                            <h4 className="text-xs font-bold text-text-primary truncate">{event.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span>
                            <span className="text-[9px] text-text-muted">{new Date(event.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            {event.regulation && (
                              <span className="text-[9px] text-text-muted bg-surface-sunken px-1.5 py-0.5 rounded">{event.regulation}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-text-muted">{event.assignee}</span>
                            {event.daysLeft !== undefined && (
                              <span className={`text-[9px] font-bold ${event.daysLeft < 0 ? 'text-danger' : event.daysLeft <= 3 ? 'text-warning' : 'text-text-muted'}`}>
                                {event.daysLeft < 0 ? `${Math.abs(event.daysLeft)}d overdue` : event.daysLeft === 0 ? 'Today' : `${event.daysLeft}d left`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              {selectedDate && filteredEvents.filter(e => e.date === selectedDate).length === 0 && (
                <div className="p-8 text-center text-text-muted text-sm">No events for this date</div>
              )}
            </div>
          </div>
        </div>
      </main>


    </div>
  );
};

export default ComplianceCalendar;
