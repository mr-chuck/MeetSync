import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Clock, CheckCircle, User } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { AppPage } from '../App';

dayjs.extend(utc);
dayjs.extend(timezone);

interface JoinMeetingProps {
  onNavigate: (page: AppPage, code?: string) => void;
  meetingCode: string;
}

interface Meeting {
  id: string;
  name: string;
  timeSlots: string[];
  participants: Array<{ name: string; joinedAt: string }>;
  votes: Record<string, string[]>;
}

const JoinMeeting: React.FC<JoinMeetingProps> = ({ onNavigate, meetingCode }) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [step, setStep] = useState<'name' | 'voting' | 'submitted'>('name');

  useEffect(() => {
    fetchMeeting();
  }, [meetingCode]);

  const fetchMeeting = async () => {
    if (!meetingCode) {
      setError('No meeting code provided');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/meetings/${meetingCode}`);
      if (response.ok) {
        const data = await response.json();
        setMeeting(data);
        setError('');
      } else {
        setError('Meeting not found. Please check the code and try again.');
      }
    } catch (err) {
      setError('Unable to load meeting. Please try again.');
    }
    setLoading(false);
  };

  const handleSlotClick = (slot: string) => {
    setSelectedSlots(prev => 
      prev.includes(slot) 
        ? prev.filter(s => s !== slot)
        : [...prev, slot]
    );
  };

  const handleSubmitVotes = async () => {
    if (!participantName.trim() || !meeting) return;

    try {
      const response = await fetch(`/api/meetings/${meeting.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantName: participantName.trim(),
          availableSlots: selectedSlots
        })
      });

      if (response.ok) {
        setStep('submitted');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit votes');
      }
    } catch (err) {
      alert('Failed to submit votes. Please try again.');
    }
  };

  const formatTimeSlot = (isoString: string) => {
    const date = dayjs(isoString).tz('America/Los_Angeles');
    return {
      date: date.format('dddd, MMM D'),
      time: date.format('h:mm A'),
      day: date.format('MMM D')
    };
  };

  // Group time slots by date
  const groupedSlots = meeting?.timeSlots.reduce((acc, slot) => {
    const formatted = formatTimeSlot(slot);
    if (!acc[formatted.date]) {
      acc[formatted.date] = [];
    }
    acc[formatted.date].push({ slot, ...formatted });
    return acc;
  }, {} as Record<string, Array<{ slot: string; date: string; time: string; day: string }>>) || {};

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading meeting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-red-800 mb-2">Meeting Not Found</h1>
          <p className="text-red-600 mb-4">{error}</p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (step === 'name') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Meeting</h1>
          <p className="text-gray-600">You're joining: <strong>{meeting?.name}</strong></p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="participantName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="participantName"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                onKeyPress={(e) => e.key === 'Enter' && participantName.trim() && setStep('voting')}
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Meeting Details</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Meeting:</strong> {meeting?.name}</p>
                <p><strong>Time Slots:</strong> {meeting?.timeSlots.length} options</p>
                <p><strong>Participants:</strong> {meeting?.participants.length || 0} joined</p>
              </div>
            </div>

            <button
              onClick={() => setStep('voting')}
              disabled={!participantName.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Vote
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'voting') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => setStep('name')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vote on Your Availability</h1>
          <p className="text-gray-600">
            Hi <strong>{participantName}</strong>! Click on the time slots when you're available for "{meeting?.name}".
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>All times in Pacific Daylight Time (PDT)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-gray-100 rounded border"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-green-500 rounded"></span>
              <span>Selected ({selectedSlots.length})</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedSlots).map(([date, slots]) => (
            <div key={date} className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{date}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {slots.map(({ slot, time }) => {
                  const voteCount = meeting?.votes[slot]?.length || 0;
                  const isSelected = selectedSlots.includes(slot);
                  
                  return (
                    <button
                      key={slot}
                      onClick={() => handleSlotClick(slot)}
                      className={`px-3 py-3 rounded-lg text-sm font-medium transition-all relative ${
                        isSelected
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div>{time}</div>
                      {voteCount > 0 && (
                        <div className={`text-xs mt-1 ${isSelected ? 'text-green-100' : 'text-gray-500'}`}>
                          {voteCount} vote{voteCount !== 1 ? 's' : ''}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900">
                Ready to submit your availability?
              </p>
              <p className="text-gray-600">
                {selectedSlots.length} time slot{selectedSlots.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            <button
              onClick={handleSubmitVotes}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
            >
              Submit Votes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'submitted') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Votes Submitted!</h1>
          <p className="text-gray-600">
            Thank you <strong>{participantName}</strong>! Your availability has been recorded.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-4">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Meeting: {meeting?.name}</h3>
            <p className="text-gray-600">You voted for {selectedSlots.length} time slot{selectedSlots.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('results', meetingCode)}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
            >
              View Meeting Results
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default JoinMeeting;