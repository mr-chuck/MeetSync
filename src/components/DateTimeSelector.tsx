import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';

interface DateTimeSelectorProps {
  mode?: 'create' | 'vote';
  onCreateChange?: (dates: string[], startTime: string, endTime: string) => void;
  onVoteChange?: (timeSlots: string[]) => void;
  onComplete?: () => void;
  meetingData?: {
    dates: string[];
    startTime: string;
    endTime: string;
  };
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  mode = 'create',
  onCreateChange,
  onVoteChange,
  onComplete,
  meetingData
}) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');

  // Initialize for voting mode
  useEffect(() => {
    if (mode === 'vote' && meetingData) {
      setSelectedDates(new Set(meetingData.dates));
      setStartTime(meetingData.startTime);
      setEndTime(meetingData.endTime);
    }
  }, [mode, meetingData]);

  // Generate time slots (30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    const start = dayjs(`2000-01-01 ${startTime}`);
    const end = dayjs(`2000-01-01 ${endTime}`);
    let current = start;
    
    while (current.isBefore(end) || current.isSame(end)) {
      slots.push(current.format('HH:mm'));
      current = current.add(30, 'minute');
    }
    return slots;
  };

  // Generate calendar days
  const generateCalendarDays = (month: dayjs.Dayjs) => {
    const startOfMonth = month.startOf('month');
    const endOfMonth = month.endOf('month');
    const startOfCalendar = startOfMonth.startOf('week');
    const endOfCalendar = endOfMonth.endOf('week');
    
    const days = [];
    let current = startOfCalendar;
    
    while (current.isBefore(endOfCalendar) || current.isSame(endOfCalendar, 'day')) {
      days.push(current);
      current = current.add(1, 'day');
    }
    
    return days;
  };

  const handleDateClick = (date: dayjs.Dayjs) => {
    if (mode === 'vote') return;
    
    const dateStr = date.format('YYYY-MM-DD');
    const newSelectedDates = new Set(selectedDates);
    
    if (newSelectedDates.has(dateStr)) {
      newSelectedDates.delete(dateStr);
    } else {
      newSelectedDates.add(dateStr);
    }
    
    setSelectedDates(newSelectedDates);
    
    // Update parent component
    if (onCreateChange) {
      const datesArray = Array.from(newSelectedDates).sort();
      onCreateChange(datesArray, startTime, endTime);
    }
  };

  const handleTimeRangeChange = (newStartTime: string, newEndTime: string) => {
    setStartTime(newStartTime);
    setEndTime(newEndTime);
    
    // Update parent component
    if (onCreateChange) {
      const datesArray = Array.from(selectedDates).sort();
      onCreateChange(datesArray, newStartTime, newEndTime);
    }
  };

  const handleSlotClick = (date: string, time: string) => {
    // Create proper ISO string for consistency
    const slotKey = new Date(`${date}T${time}:00-07:00`).toISOString();
    const newSelectedSlots = new Set(selectedSlots);
    
    if (newSelectedSlots.has(slotKey)) {
      newSelectedSlots.delete(slotKey);
    } else {
      newSelectedSlots.add(slotKey);
    }
    
    setSelectedSlots(newSelectedSlots);
    
    // Update parent component for voting
    if (onVoteChange) {
      const timeSlots = Array.from(newSelectedSlots);
      onVoteChange(timeSlots);
    }
  };

  const handleSlotMouseDown = (date: string, time: string) => {
    setIsDragging(true);
    const slotKey = new Date(`${date}T${time}:00-07:00`).toISOString();
    const isCurrentlySelected = selectedSlots.has(slotKey);
    setDragMode(isCurrentlySelected ? 'deselect' : 'select');
    handleSlotClick(date, time);
  };

  const handleSlotMouseEnter = (date: string, time: string) => {
    if (!isDragging) return;
    
    const slotKey = new Date(`${date}T${time}:00-07:00`).toISOString();
    const newSelectedSlots = new Set(selectedSlots);
    
    if (dragMode === 'select') {
      newSelectedSlots.add(slotKey);
    } else {
      newSelectedSlots.delete(slotKey);
    }
    
    setSelectedSlots(newSelectedSlots);
    
    // Update parent component for voting
    if (onVoteChange) {
      const timeSlots = Array.from(newSelectedSlots);
      onVoteChange(timeSlots);
    }
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? prev.subtract(1, 'month') : prev.add(1, 'month')
    );
  };

  const timeSlots = generateTimeSlots();
  const dates = Array.from(selectedDates).sort();
  const today = dayjs();

  // For create mode, show calendar first, then time selection
  if (mode === 'create' && !showTimeSelection) {
    const days = generateCalendarDays(currentMonth);
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Dates</h2>
          <p className="text-gray-600">Choose the dates when your meeting could happen</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-4 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">{currentMonth.format('MMMM YYYY')}</h3>
            <div className="flex space-x-1">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dateStr = day.format('YYYY-MM-DD');
              const isCurrentMonth = day.month() === currentMonth.month();
              const isToday = day.isSame(today, 'day');
              const isSelected = selectedDates.has(dateStr);
              const isPast = day.isBefore(today, 'day');
              
              return (
                <button
                  key={index}
                  onClick={() => !isPast && isCurrentMonth && handleDateClick(day)}
                  disabled={isPast || !isCurrentMonth}
                  className={`
                    h-8 w-8 text-xs rounded transition-colors
                    ${isCurrentMonth 
                      ? isPast
                        ? 'text-gray-300 cursor-not-allowed'
                        : isSelected
                          ? 'bg-blue-500 text-white'
                          : isToday
                            ? 'bg-blue-100 text-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-blue-50'
                      : 'text-gray-300'
                    }
                  `}
                >
                  {day.date()}
                </button>
              );
            })}
          </div>
        </div>
        
        {selectedDates.size > 0 && (
          <div className="text-center">
            <button
              onClick={() => setShowTimeSelection(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Continue ({selectedDates.size} date{selectedDates.size !== 1 ? 's' : ''})
            </button>
          </div>
        )}
      </div>
    );
  }

  // Time selection step for create mode
  if (mode === 'create' && showTimeSelection) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Set Time Range</h2>
          <p className="text-gray-600">What's the earliest and latest time for your meeting?</p>
          <p className="text-sm text-gray-500 mt-1">
            Selected dates: {Array.from(selectedDates).map(d => dayjs(d).format('MMM D')).join(', ')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">No earlier than</label>
              <select
                value={startTime}
                onChange={(e) => handleTimeRangeChange(e.target.value, endTime)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({length: 24}, (_, i) => {
                  const time = `${i.toString().padStart(2, '0')}:00`;
                  const label = dayjs(`2000-01-01 ${time}`).format('h:mm A');
                  return <option key={time} value={time}>{label}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">No later than</label>
              <select
                value={endTime}
                onChange={(e) => handleTimeRangeChange(startTime, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({length: 24}, (_, i) => {
                  const time = `${(i + 1).toString().padStart(2, '0')}:00`;
                  const label = dayjs(`2000-01-01 ${time}`).format('h:mm A');
                  return <option key={time} value={time}>{label}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="text-center space-y-3">
          <button
            onClick={onComplete}
            className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            Create Meeting
          </button>
          <div>
            <button
              onClick={() => setShowTimeSelection(false)}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              ← Back to date selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Voting mode - When2Meet style grid
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Mark Your Availability</h2>
        <p className="text-gray-600">Click and drag to select when you're available</p>
      </div>

      {/* When2Meet style compact grid */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${100 + dates.length * 80}px` }}>
            {/* Header row with dates */}
            <div className="flex bg-gray-50 border-b">
              <div className="w-24 flex-shrink-0 p-3 text-xs font-medium text-gray-600 border-r bg-gray-100">
                Time
              </div>
              {dates.map(dateStr => {
                const date = dayjs(dateStr);
                return (
                  <div key={dateStr} className="w-20 flex-shrink-0 p-2 text-center border-r last:border-r-0 bg-gray-50">
                    <div className="text-xs font-semibold text-gray-900">{date.format('ddd')}</div>
                    <div className="text-xs text-gray-600">{date.format('M/D')}</div>
                  </div>
                );
              })}
            </div>
            
            {/* Time slots grid */}
            <div className="max-h-96 overflow-y-auto">
              {timeSlots.map(time => {
                const timeLabel = dayjs(`2000-01-01 ${time}`).format('h:mm A');
                
                return (
                  <div key={time} className="flex border-b border-gray-100 hover:bg-gray-50">
                    <div className="w-24 flex-shrink-0 p-2 text-xs text-gray-700 font-medium border-r bg-gray-50 flex items-center">
                      {timeLabel}
                    </div>
                    {dates.map(dateStr => {
                      const slotKey = new Date(`${dateStr}T${time}:00-07:00`).toISOString();
                      const isSelected = selectedSlots.has(slotKey);
                      
                      return (
                        <div key={slotKey} className="w-20 flex-shrink-0 p-1 border-r last:border-r-0">
                          <button
                            onMouseDown={() => handleSlotMouseDown(dateStr, time)}
                            onMouseEnter={() => handleSlotMouseEnter(dateStr, time)}
                            className={`
                              w-full h-7 rounded-sm border transition-colors select-none text-xs font-medium
                              ${isSelected
                                ? 'bg-green-500 border-green-600 text-white shadow-sm'
                                : 'bg-white border-gray-200 hover:bg-green-100 hover:border-green-400'
                              }
                            `}
                          >
                            {isSelected ? '✓' : ''}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onComplete}
          disabled={selectedSlots.size === 0}
          className="bg-green-500 text-white px-8 py-3 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
        >
          Submit Availability
          {selectedSlots.size > 0 && (
            <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-sm">
              {selectedSlots.size} slot{selectedSlots.size !== 1 ? 's' : ''}
            </span>
          )}
        </button>
      </div>

      <div className="text-center text-sm text-gray-500 bg-blue-50 rounded-lg p-3">
        💡 <strong>Tip:</strong> Click and drag to select multiple time slots quickly
      </div>
    </div>
  );
};

export default DateTimeSelector;