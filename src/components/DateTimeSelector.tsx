import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface DateTimeSelectorProps {
  onSelectionChange: (dates: string[], timeSlots: string[]) => void;
  onComplete?: () => void;
  initialDates?: string[];
  initialTimeSlots?: string[];
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  onSelectionChange,
  onComplete,
  initialDates = [],
  initialTimeSlots = []
}) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs().tz('America/Los_Angeles'));
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set(initialDates));
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Set<string>>(new Set(initialTimeSlots));
  const [step, setStep] = useState<'dates' | 'times'>('dates');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');
  
  const timeGridRef = useRef<HTMLDivElement>(null);

  // Generate time slots (00:00 to 23:30 in 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = dayjs().hour(hour).minute(minute).second(0);
        slots.push({
          value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          label: time.format('h:mm A'),
          hour24: time.format('HH:mm')
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Generate calendar days for a month
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
    const dateStr = date.format('YYYY-MM-DD');
    const newSelectedDates = new Set(selectedDates);
    
    if (newSelectedDates.has(dateStr)) {
      newSelectedDates.delete(dateStr);
    } else {
      newSelectedDates.add(dateStr);
    }
    
    setSelectedDates(newSelectedDates);
    onSelectionChange(Array.from(newSelectedDates), Array.from(selectedTimeSlots));
  };

  const handleTimeSlotMouseDown = (timeSlot: string, date: string) => {
    const slotKey = `${date}-${timeSlot}`;
    setIsDragging(true);
    setDragStartSlot(slotKey);
    
    // Determine drag mode based on current state
    const isCurrentlySelected = selectedTimeSlots.has(slotKey);
    setDragMode(isCurrentlySelected ? 'deselect' : 'select');
    
    // Toggle the clicked slot
    const newSelectedSlots = new Set(selectedTimeSlots);
    if (isCurrentlySelected) {
      newSelectedSlots.delete(slotKey);
    } else {
      newSelectedSlots.add(slotKey);
    }
    
    setSelectedTimeSlots(newSelectedSlots);
    onSelectionChange(Array.from(selectedDates), Array.from(newSelectedSlots));
  };

  const handleTimeSlotMouseEnter = (timeSlot: string, date: string) => {
    if (!isDragging) return;
    
    const slotKey = `${date}-${timeSlot}`;
    const newSelectedSlots = new Set(selectedTimeSlots);
    
    if (dragMode === 'select') {
      newSelectedSlots.add(slotKey);
    } else {
      newSelectedSlots.delete(slotKey);
    }
    
    setSelectedTimeSlots(newSelectedSlots);
    onSelectionChange(Array.from(selectedDates), Array.from(newSelectedSlots));
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartSlot(null);
  }, []);

  // Touch event handlers
  const handleTouchStart = (timeSlot: string, date: string, e: React.TouchEvent) => {
    e.preventDefault();
    handleTimeSlotMouseDown(timeSlot, date);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.dataset.timeSlot && element.dataset.date) {
      handleTimeSlotMouseEnter(element.dataset.timeSlot, element.dataset.date);
    }
  }, [isDragging, dragMode, selectedTimeSlots]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  // Set up global event listeners
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseUp, handleTouchMove, handleTouchEnd]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? prev.subtract(1, 'month') : prev.add(1, 'month')
    );
  };

  const renderCalendar = (month: dayjs.Dayjs, isSecondary = false) => {
    const days = generateCalendarDays(month);
    const today = dayjs().tz('America/Los_Angeles');
    
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {month.format('MMMM YYYY')}
          </h3>
          {!isSecondary && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dateStr = day.format('YYYY-MM-DD');
            const isCurrentMonth = day.month() === month.month();
            const isToday = day.isSame(today, 'day');
            const isSelected = selectedDates.has(dateStr);
            const isPast = day.isBefore(today, 'day');
            
            return (
              <button
                key={index}
                onClick={() => !isPast && isCurrentMonth && handleDateClick(day)}
                disabled={isPast || !isCurrentMonth}
                className={`
                  h-11 w-full rounded-lg text-sm font-medium transition-all duration-200
                  ${isCurrentMonth 
                    ? isPast
                      ? 'text-gray-300 cursor-not-allowed'
                      : isSelected
                        ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
                        : isToday
                          ? 'bg-blue-50 text-blue-600 border-2 border-blue-200 hover:bg-blue-100'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
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
    );
  };

  const renderTimeGrid = () => {
    const sortedDates = Array.from(selectedDates).sort();
    
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Clock className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Select Available Times</h3>
          <span className="text-sm text-gray-500">(Pacific Daylight Time)</span>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header with dates */}
            <div className="flex border-b border-gray-200 pb-4 mb-4">
              <div className="w-20 flex-shrink-0"></div>
              {sortedDates.map(dateStr => {
                const date = dayjs(dateStr);
                return (
                  <div key={dateStr} className="flex-1 min-w-24 text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {date.format('ddd')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {date.format('MMM D')}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Time grid */}
            <div 
              ref={timeGridRef}
              className="max-h-96 overflow-y-auto"
              style={{ scrollbarWidth: 'thin' }}
            >
              {timeSlots.map(timeSlot => (
                <div key={timeSlot.value} className="flex items-center border-b border-gray-100 last:border-b-0">
                  <div className="w-20 flex-shrink-0 py-2 text-sm text-gray-600 font-medium">
                    {timeSlot.label}
                  </div>
                  {sortedDates.map(dateStr => {
                    const slotKey = `${dateStr}-${timeSlot.value}`;
                    const isSelected = selectedTimeSlots.has(slotKey);
                    
                    return (
                      <div key={slotKey} className="flex-1 min-w-24 px-1">
                        <button
                          data-time-slot={timeSlot.value}
                          data-date={dateStr}
                          onMouseDown={() => handleTimeSlotMouseDown(timeSlot.value, dateStr)}
                          onMouseEnter={() => handleTimeSlotMouseEnter(timeSlot.value, dateStr)}
                          onTouchStart={(e) => handleTouchStart(timeSlot.value, dateStr, e)}
                          className={`
                            w-full h-11 rounded-lg border-2 transition-all duration-150 select-none
                            ${isSelected
                              ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                              : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                            }
                          `}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>💡 <strong>Tip:</strong> Click and drag to select multiple time slots at once</p>
        </div>
      </div>
    );
  };

  if (step === 'dates') {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Select Dates</h2>
          </div>
          <p className="text-gray-600">Choose the dates when your meeting could happen</p>
        </div>
        
        {/* Calendar grid - responsive layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {renderCalendar(currentMonth)}
          {renderCalendar(currentMonth.add(1, 'month'), true)}
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-center">
          <button
            onClick={() => setStep('times')}
            disabled={selectedDates.size === 0}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>Continue to Time Selection</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
              {selectedDates.size} date{selectedDates.size !== 1 ? 's' : ''}
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Clock className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Select Times</h2>
        </div>
        <p className="text-gray-600">
          Choose your available time slots for the selected dates
        </p>
      </div>
      
      {selectedDates.size > 0 ? (
        renderTimeGrid()
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No dates selected</p>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setStep('dates')}
          className="bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
        >
          Back to Date Selection
        </button>
        <button
          disabled={selectedTimeSlots.size === 0}
          onClick={() => {
            const dates = Array.from(selectedDates);
            const timeSlots = Array.from(selectedTimeSlots);
            onSelectionChange(dates, timeSlots);
            onComplete?.();
          }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <span>Create Event</span>
          <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
            {selectedTimeSlots.size} slot{selectedTimeSlots.size !== 1 ? 's' : ''}
          </span>
        </button>
      </div>
    </div>
  );
};

export default DateTimeSelector;