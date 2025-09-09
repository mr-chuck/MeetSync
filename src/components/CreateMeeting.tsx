import React, { useState } from 'react';
import { ArrowLeft, Share2, Copy, CheckCircle, Calendar, Clock } from 'lucide-react';
import DateTimeSelector from './DateTimeSelector';
import type { AppPage } from '../App';

interface CreateMeetingProps {
  onNavigate: (page: AppPage, code?: string) => void;
}

const CreateMeeting: React.FC<CreateMeetingProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<'name' | 'datetime' | 'published'>('name');
  const [meetingName, setMeetingName] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [meetingCode, setMeetingCode] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [copying, setCopying] = useState(false);

  const handleSelectionChange = (dates: string[], timeSlots: string[]) => {
    setSelectedDates(dates);
    setSelectedTimeSlots(timeSlots);
  };

  const handlePublish = async () => {
    if (selectedTimeSlots.length === 0) return;

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: meetingName,
          timeSlots: selectedTimeSlots
        })
      });

      const data = await response.json();
      setMeetingCode(data.code);
      setJoinUrl(data.joinUrl);
      setStep('published');
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Meeting</h1>
          <p className="text-gray-600">Give your meeting a name to get started</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="meetingName" className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Name
              </label>
              <input
                type="text"
                id="meetingName"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                placeholder="e.g., Team Standup, Project Review, Coffee Chat"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                onKeyPress={(e) => e.key === 'Enter' && meetingName.trim() && setStep('calendar')}
              />
            </div>

            <button
              onClick={() => setStep('datetime')}
              disabled={!meetingName.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Time Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'datetime') {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Your Meeting</h1>
          <p className="text-gray-600">
            Set up the dates and times for "{meetingName}". Participants will vote on these options.
          </p>
        </div>

        <DateTimeSelector
          onSelectionChange={handleSelectionChange}
          onComplete={handlePublish}
          initialDates={selectedDates}
          initialTimeSlots={selectedTimeSlots}
        />
      </div>
    );
  }

  if (step === 'published') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meeting Published!</h1>
          <p className="text-gray-600">Share the code or link below with participants</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Meeting Details</h3>
            <p className="text-gray-600">{meetingName}</p>
            <p className="text-sm text-gray-500">{selectedTimeSlots.length} time slots available</p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share with Participants</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Join Code</label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-50 px-4 py-3 rounded-xl font-mono text-lg tracking-wider text-center">
                    {meetingCode}
                  </div>
                  <button
                    onClick={() => copyToClipboard(meetingCode)}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    {copying ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Direct Link</label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-50 px-4 py-3 rounded-xl text-sm text-gray-600 truncate">
                    {joinUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(joinUrl)}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-3">
            <button
              onClick={() => onNavigate('results', meetingCode)}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
            >
              View Results & Manage Meeting
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
            >
              Create Another Meeting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CreateMeeting;