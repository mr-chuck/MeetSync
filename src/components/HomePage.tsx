import React, { useState } from 'react';
import { Calendar, Users, ArrowRight, Code } from 'lucide-react';
import type { AppPage } from '../App';

interface HomePageProps {
  onNavigate: (page: AppPage, code?: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [joinCode, setJoinCode] = useState('');

  const handleJoinWithCode = () => {
    if (joinCode.trim()) {
      onNavigate('join', joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="text-center">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Find the perfect meeting time
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Coordinate schedules effortlessly. No sign-ups required – just create, share, and sync.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Create Meeting Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Create Meeting</h2>
          <p className="text-gray-600 mb-6">
            Set up your meeting, choose available time slots, and get a shareable code for participants.
          </p>
          <button
            onClick={() => onNavigate('create')}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 group"
          >
            <span>Create New Meeting</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Join Meeting Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Join Meeting</h2>
          <p className="text-gray-600 mb-6">
            Enter a meeting code to vote on your availability for the proposed time slots.
          </p>
          <div className="space-y-4">
            <div className="relative">
              <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Enter meeting code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinWithCode()}
              />
            </div>
            <button
              onClick={handleJoinWithCode}
              disabled={!joinCode.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Join Meeting</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
        <div className="space-y-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Easy Scheduling</h3>
          <p className="text-gray-600 text-sm">
            Select time slots with a simple calendar interface
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Group Coordination</h3>
          <p className="text-gray-600 text-sm">
            Everyone votes on their availability for optimal scheduling
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <Code className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">No Sign-Up</h3>
          <p className="text-gray-600 text-sm">
            Simple code-based system with no registration required
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;