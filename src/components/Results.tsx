import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Clock, Trophy, Share2, Copy, CheckCircle, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { apiService } from '../services/api';
import type { AppPage } from '../App';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

interface ResultsProps {
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

interface BestSlot {
  slot: string;
  votes: number;
  percentage: number;
}

interface VoteSummary {
  slot: string;
  votes: number;
  voters: string[];
}

interface ResultsData {
  meeting: Meeting;
  bestSlots: BestSlot[];
  votesSummary: VoteSummary[];
}

const Results: React.FC<ResultsProps> = ({ onNavigate, meetingCode }) => {
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetchResults();
    // Refresh results every 10 seconds to show real-time updates
    const interval = setInterval(fetchResults, 10000);
    return () => clearInterval(interval);
  }, [meetingCode]);

  const fetchResults = async () => {
    if (!meetingCode) {
      setError('No meeting code provided');
      setLoading(false);
      return;
    }

    try {
      const data = await apiService.getResults(meetingCode);
      console.log('Results data received:', data);
      setResults(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load results. Please try again.');
    }
    setLoading(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTimeSlot = (isoString: string) => {
    try {
      // Parse the ISO string and convert to PDT
      const date = dayjs(isoString);
      if (!date.isValid()) {
        console.error('Invalid date:', isoString);
        return {
          date: 'Invalid Date',
          time: 'Invalid Time',
          fullDate: 'Invalid Date'
        };
      }
      return {
        date: date.tz('America/Los_Angeles').format('dddd, MMM D'),
        time: date.tz('America/Los_Angeles').format('h:mm A'),
        fullDate: date.tz('America/Los_Angeles').format('dddd, MMMM D, YYYY'),
      };
    } catch (error) {
      console.error('Error formatting date:', isoString, error);
    return {
        date: 'Invalid Date',
        time: 'Invalid Time',
        fullDate: 'Invalid Date'
    };
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading results...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-red-800 mb-2">Results Not Available</h1>
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

  const { meeting, bestSlots, votesSummary } = results;
  const totalParticipants = meeting.participants.length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meeting Results</h1>
        <p className="text-gray-600">{meeting.name}</p>
        {meeting.creatorName && (
          <p className="text-sm text-gray-500 mt-1">Created by: {meeting.creatorName}</p>
        )}
        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
          <span className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{meeting.timeSlots.length} time slot{meeting.timeSlots.length !== 1 ? 's' : ''}</span>
          </span>
        </div>
      </div>

      {/* Share Meeting */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Share This Meeting</h2>
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-50 px-4 py-3 rounded-xl">
            <div className="text-sm text-gray-600 mb-1">Join Code</div>
            <div className="font-mono text-lg tracking-wider">{meetingCode}</div>
          </div>
          <button
            onClick={() => copyToClipboard(meetingCode)}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            title="Copy join code"
          >
            {copying ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Best Time Slots */}
      {bestSlots.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 mb-8 border border-green-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Best Meeting Time{bestSlots.length > 1 ? 's' : ''}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {bestSlots.map((bestSlot) => {
              const formatted = formatTimeSlot(bestSlot.slot);
              return (
                <div key={bestSlot.slot} className="bg-white rounded-lg p-3 shadow-sm border border-green-200 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Trophy className="w-4 h-4 text-green-600 mr-1" />
                    <h3 className="text-sm font-semibold text-gray-900">{formatted.time}</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{formatted.date}</p>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{bestSlot.votes}</div>
                    <div className="text-xs text-gray-600">
                      {bestSlot.percentage}% available
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Time Slots Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Availability Overview</h2>
        
        {totalParticipants === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No participants have voted yet.</p>
            <p className="text-sm mt-2">Share the meeting code: <strong>{meetingCode}</strong></p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {votesSummary.sort((a, b) => new Date(a.slot).getTime() - new Date(b.slot).getTime()).map((summary) => {
              const formatted = formatTimeSlot(summary.slot);
              const percentage = Math.round((summary.votes / totalParticipants) * 100);
              const isBest = bestSlots.some(best => best.slot === summary.slot);
              
              return (
                <div 
                  key={summary.slot} 
                  className={`border rounded-lg p-3 transition-all hover:shadow-sm ${
                    isBest ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center mb-2">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <div className="font-bold text-gray-900 text-sm">{formatted.time}</div>
                      {isBest && <Trophy className="w-3 h-3 text-green-600" />}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{formatted.date}</div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-gray-900">{summary.votes}</div>
                      <div className="text-xs text-gray-500">of {totalParticipants} ({percentage}%)</div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isBest ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  {/* Voters list */}
                  {summary.voters.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {summary.voters.map((voter, index) => (
                        <span 
                          key={index}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isBest 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {voter}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Participants ({meeting.participants.length})</h2>
        {meeting.participants.length === 0 ? (
          <p className="text-gray-500">No participants yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {meeting.participants.map((participant, index) => (
              <div key={index} className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-full border">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Users className="w-3 h-3 text-white" />
                </div>
                <div className="font-medium text-gray-900 text-sm">{participant.name}</div>
                <div className="text-xs text-gray-400">
                  {dayjs(participant.joinedAt).fromNow()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;