import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Clock, CheckCircle, User } from 'lucide-react';
import DateTimeSelector from './DateTimeSelector';
import { apiService } from '../services/api';
import type { AppPage } from '../App';

interface JoinMeetingProps {
  onNavigate: (page: AppPage, code?: string) => void;
  meetingCode: string;
}

interface Meeting {
  id: string;
  name: string;
  creatorName: string;
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

  // Extract meeting data for the calendar
  const [meetingData, setMeetingData] = useState<{
    dates: string[];
    startTime: string;
    endTime: string;
  } | null>(null);

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
      const data = await apiService.getMeeting(meetingCode);
      setMeeting(data);
      
      // Extract dates and time range from meeting time slots
      if (data.timeSlots && data.timeSlots.length > 0) {
        const dates = new Set<string>();
        const times: string[] = [];
        
        data.timeSlots.forEach(slot => {
          try {
            // Parse the ISO string and convert to local date/time
            if (!slot || typeof slot !== 'string') {
              console.error('Invalid date:', slot);
              return;
            }
            
            // Parse as proper ISO date
            const date = new Date(slot);
            if (isNaN(date.getTime())) {
              console.error('Invalid ISO date:', slot);
              return;
            }
            
            // Convert to PDT and extract date/time parts
            const pdt = new Date(date.getTime() - (7 * 60 * 60 * 1000)); // Convert to PDT
            const dateStr = pdt.toISOString().split('T')[0]; // YYYY-MM-DD
            const timeStr = pdt.toISOString().split('T')[1].substring(0, 5); // HH:MM
            
            dates.add(dateStr);
            times.push(timeStr);
          } catch (e) {
            console.error('Error parsing slot:', slot, e);
          }
        });
        
        console.log('Extracted dates:', Array.from(dates));
        console.log('Extracted times:', times);
        
        const sortedTimes = times.sort();
        setMeetingData({
          dates: Array.from(dates).sort(),
          startTime: sortedTimes[0] || '09:00',
          endTime: sortedTimes[sortedTimes.length - 1] || '17:00'
        });
      } else {
        console.error('No time slots found in meeting data');
      }
      
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load meeting. Please try again.');
    }
    setLoading(false);
  };

  const handleSelectionChange = (timeSlots: string[]) => {
    setSelectedSlots(timeSlots);
  };

  const handleSubmitVotes = async () => {
    if (!participantName.trim() || !meeting) return;

    try {
      // Selected slots are already in ISO format from DateTimeSelector
      const isoSlots = Array.from(selectedSlots);
      
      console.log('Submitting votes:', {
        participantName: participantName.trim(),
        availableSlots: isoSlots,
        meetingTimeSlots: meeting.timeSlots
      });
      
      const result = await apiService.submitVote(meeting.id, {
        participantName: participantName.trim(),
        availableSlots: isoSlots
      });

      // Update the meeting state with the returned data
      if (result.meeting) {
        setMeeting(result.meeting);
      }

      setStep('submitted');
    } catch (err) {
      console.error('Vote submission error:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit votes. Please try again.');
    }
  };

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
          <p className="text-gray-600">
            You're joining: <strong>{meeting?.name}</strong>
            {meeting?.creatorName && (
              <span className="block text-sm mt-1">Created by: {meeting.creatorName}</span>
            )}
          </p>
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
                {meeting?.creatorName && <p><strong>Created by:</strong> {meeting.creatorName}</p>}
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
      <div className="max-w-6xl mx-auto">
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
            Hi <strong>{participantName}</strong>! Select the time slots when you're available for "{meeting?.name}".
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <p className="text-blue-800 text-sm">
              <strong>Instructions:</strong> Use the same calendar interface the meeting creator used. 
              Click and drag to select multiple time slots that work for your schedule.
            </p>
          </div>
        </div>

        {meetingData && (
          <DateTimeSelector
            mode="vote"
            meetingData={meetingData}
            onVoteChange={handleSelectionChange}
            onComplete={handleSubmitVotes}
          />
        )}
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