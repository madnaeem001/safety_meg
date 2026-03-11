import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AuditSchedule, IndustryAuditTemplate } from '../../data/mockAudit';

type CalendarViewType = 'month' | 'week' | 'day';

interface CalendarViewProps {
  schedules: AuditSchedule[];
  onScheduleClick?: (schedule: AuditSchedule) => void;
  onDateClick?: (date: Date) => void;
  onCreateSchedule?: () => void;
  industryIcons: Record<IndustryAuditTemplate['industry'], React.ElementType>;
  startDayOfWeek?: 'sunday' | 'monday';
}

const DAYS_SUNDAY_START = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_MONDAY_START = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const getStatusColor = (status: AuditSchedule['status']) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-500';
    case 'in_progress': return 'bg-amber-500';
    case 'completed': return 'bg-emerald-500';
    case 'overdue': return 'bg-red-500';
    case 'cancelled': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

const getStatusBgColor = (status: AuditSchedule['status']) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
    case 'in_progress': return 'bg-amber-50 border-amber-200 hover:bg-amber-100';
    case 'completed': return 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100';
    case 'overdue': return 'bg-red-50 border-red-200 hover:bg-red-100';
    case 'cancelled': return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    default: return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
  }
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  schedules,
  onScheduleClick,
  onDateClick,
  onCreateSchedule,
  industryIcons,
  startDayOfWeek = 'sunday'
}) => {
  const DAYS = startDayOfWeek === 'monday' ? DAYS_MONDAY_START : DAYS_SUNDAY_START;
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get first day of month and total days
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  // Get schedules for a specific date
  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(s => s.scheduledDate === dateStr);
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    
    // Adjust starting day based on startDayOfWeek preference
    let adjustedStartingDay = startingDayOfWeek;
    if (startDayOfWeek === 'monday') {
      adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    }
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedStartingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }
    
    return days;
  }, [currentDate, startingDayOfWeek, totalDays, startDayOfWeek]);

  // Get week dates
  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const navigatePrev = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewType === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const navigateNext = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewType === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const selectedDateSchedules = selectedDate ? getSchedulesForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-soft p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrev}
              className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-surface-600" />
            </button>
            <h2 className="text-lg font-bold text-brand-900 min-w-[180px] text-center">
              {viewType === 'day' 
                ? currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : viewType === 'week'
                  ? `Week of ${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              }
            </h2>
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-surface-600" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-bold text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
            >
              Today
            </button>
            <div className="flex bg-surface-100 rounded-lg p-0.5">
              {(['month', 'week', 'day'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    viewType === type
                      ? 'bg-white text-brand-900 shadow-sm'
                      : 'text-surface-600 hover:text-surface-900'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Month View */}
        {viewType === 'month' && (
          <div>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-bold text-surface-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="h-24 md:h-28" />;
                }
                
                const daySchedules = getSchedulesForDate(date);
                const hasSchedules = daySchedules.length > 0;
                
                return (
                  <motion.button
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`h-24 md:h-28 p-1.5 rounded-xl border transition-all text-left flex flex-col ${
                      isSelected(date)
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                        : isToday(date)
                          ? 'border-brand-300 bg-brand-50/50'
                          : 'border-surface-100 hover:border-surface-200 hover:bg-surface-50'
                    }`}
                  >
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday(date)
                        ? 'bg-brand-600 text-white'
                        : isSelected(date)
                          ? 'bg-brand-100 text-brand-700'
                          : 'text-surface-700'
                    }`}>
                      {date.getDate()}
                    </span>
                    
                    {hasSchedules && (
                      <div className="mt-1 flex-1 overflow-hidden space-y-0.5">
                        {daySchedules.slice(0, 2).map(schedule => {
                          const Icon = industryIcons[schedule.industry];
                          return (
                            <div
                              key={schedule.id}
                              onClick={(e) => { e.stopPropagation(); onScheduleClick?.(schedule); }}
                              className={`px-1.5 py-0.5 rounded text-xs font-medium truncate flex items-center gap-1 cursor-pointer border ${getStatusBgColor(schedule.status)}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(schedule.status)}`} />
                              <span className="truncate text-surface-700">{schedule.title}</span>
                            </div>
                          );
                        })}
                        {daySchedules.length > 2 && (
                          <span className="text-xs text-surface-500 font-medium px-1.5">
                            +{daySchedules.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewType === 'week' && (
          <div>
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map(date => {
                const daySchedules = getSchedulesForDate(date);
                
                return (
                  <div key={date.toISOString()} className="min-h-[300px]">
                    <button
                      onClick={() => handleDateClick(date)}
                      className={`w-full p-2 rounded-xl mb-2 transition-colors ${
                        isSelected(date)
                          ? 'bg-brand-100'
                          : isToday(date)
                            ? 'bg-brand-50'
                            : 'bg-surface-50 hover:bg-surface-100'
                      }`}
                    >
                      <p className="text-xs text-surface-500 font-medium">{DAYS[date.getDay()]}</p>
                      <p className={`text-lg font-bold ${
                        isToday(date) ? 'text-brand-600' : 'text-surface-900'
                      }`}>{date.getDate()}</p>
                    </button>
                    
                    <div className="space-y-2">
                      {daySchedules.map(schedule => {
                        const Icon = industryIcons[schedule.industry];
                        return (
                          <motion.div
                            key={schedule.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => onScheduleClick?.(schedule)}
                            className={`p-2 rounded-lg border cursor-pointer transition-colors ${getStatusBgColor(schedule.status)}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`w-2 h-2 rounded-full ${getStatusColor(schedule.status)}`} />
                              <span className="text-xs font-bold text-surface-900 truncate">{schedule.title}</span>
                            </div>
                            <p className="text-xs text-surface-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {schedule.scheduledTime}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day View */}
        {viewType === 'day' && (
          <div className="space-y-3">
            {getSchedulesForDate(currentDate).length === 0 ? (
              <div className="text-center py-12 text-surface-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No audits scheduled for this day</p>
                <button
                  onClick={onCreateSchedule}
                  className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors"
                >
                  Schedule Audit
                </button>
              </div>
            ) : (
              getSchedulesForDate(currentDate).map(schedule => {
                const Icon = industryIcons[schedule.industry];
                return (
                  <motion.div
                    key={schedule.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => onScheduleClick?.(schedule)}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${getStatusBgColor(schedule.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                        <Icon className="w-6 h-6 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(schedule.status)}`} />
                          <h3 className="font-bold text-surface-900">{schedule.title}</h3>
                        </div>
                        <p className="text-sm text-surface-600 mb-3">{schedule.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-surface-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {schedule.scheduledTime} ({schedule.duration} min)
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {schedule.assignedTo}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {schedule.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected Date Detail Panel */}
      <AnimatePresence>
        {selectedDate && viewType === 'month' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-2xl border border-surface-100 shadow-soft p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-brand-900">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <button
                onClick={onCreateSchedule}
                className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 transition-colors"
              >
                + New Audit
              </button>
            </div>
            
            {selectedDateSchedules.length === 0 ? (
              <p className="text-surface-500 text-sm text-center py-4">No audits scheduled for this day</p>
            ) : (
              <div className="space-y-2">
                {selectedDateSchedules.map(schedule => {
                  const Icon = industryIcons[schedule.industry];
                  return (
                    <motion.div
                      key={schedule.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => onScheduleClick?.(schedule)}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors ${getStatusBgColor(schedule.status)}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${getStatusColor(schedule.status)}`} />
                            <h4 className="font-bold text-sm text-surface-900 truncate">{schedule.title}</h4>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-surface-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {schedule.scheduledTime}
                            </span>
                            <span>{schedule.assignedTo}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;
