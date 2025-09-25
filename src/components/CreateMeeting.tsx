import React, { useState, useCallback } from 'react';
import { ArrowLeft, Share2, Copy, CheckCircle, Calendar, Clock, User } from 'lucide-react';
import DateTimeSelector from './DateTimeSelector';
import { apiService } from '../services/api';
import type { AppPage } from '../App';

interface CreateMeetingProps {
  onNavigate: (page: AppPage, code?: string) => void;
}

const CreateMeeting: React.FC<CreateMeetingProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<'setup' | 'times' | 'published'>('setup');
  const [meetingName, setMeetingName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [selectedDatesForCreation, setSelectedDatesForCreation] = useState<string[]>([]);
  const [selectedStartTimeForCreation, setSelectedStartTimeForCreation] = useState('');
  const [selectedEndTimeForCreation, setSelectedEndTimeForCreation] = useState('');
  const [meetingCode, setMeetingCode] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [copying, setCopying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateChange = (dates: string[], startTime: string, endTime: string) => {
    setSelectedDatesForCreation(dates);
    setSelectedStartTimeForCreation(startTime);
    setSelectedEndTimeForCreation(endTime);
  };

  const handlePublish = useCallback(async () => {
    if (selectedDatesForCreation.length === 0 || !creatorName.trim() || !meetingName.trim() || !selectedStartTimeForCreation || !selectedEndTimeForCreation) {
      console.error('Missing required fields:', { 
        dates: selectedDatesForCreation.length, 
        creatorName: creatorName.trim(), 
        meetingName: meetingName.trim(),
        startTime: selectedStartTimeForCreation,
        endTime: selectedEndTimeForCreation
      });
      return;
    }
    
    setIsCreating(true);
    console.log('Creating meeting with:', { 
      meetingName, 
      dates: selectedDatesForCreation, 
      startTime: selectedStartTimeForCreation,
      endTime: selectedEndTimeForCreation,
      creatorName 
    });

    try {
      const data = await apiService.createMeeting({
        name: meetingName,
        dates: selectedDatesForCreation,
        startTime: selectedStartTimeForCreation,
        endTime: selectedEndTimeForCreation,
        creatorName: creatorName.trim()
      });
      console.log('Meeting created successfully:', data);
      setMeetingCode(data.code);
      setJoinUrl(`${window.location.origin}?code=${data.code}`);
      setStep('published');
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert(`Failed to create meeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  }, [meetingName, selectedDatesForCreation, selectedStartTimeForCreation, selectedEndTimeForCreation, creatorName]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (step === 'setup') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Meeting</h1>
          <p className="text-gray-600">Set up your meeting name and select available dates</p>
        </div>

        <div className="space-y-8">
          {/* Meeting Name Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Meeting Details</h2>
            </div>
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
              />
            </div>
            <div>
              <label htmlFor="creatorName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name (Meeting Creator)
              </label>
              <input
                type="text"
                id="creatorName"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Date Selection Section */}
          <DateTimeSelector
            mode="create"
            onCreateChange={handleCreateChange}
            onComplete={handlePublish}
          />
        </div>
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
            <p className="text-sm text-gray-500">Created by: {creatorName}</p>
            <p className="text-sm text-gray-500">{selectedDatesForCreation.length} date{selectedDatesForCreation.length !== 1 ? 's' : ''} available</p>
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
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
            >
              View Results & Manage Meeting
            </button>
            <button
              onClick={() => onNavigate('home')}
              disabled={isCreating}
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