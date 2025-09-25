import React, { useState } from 'react';
import { useEffect } from 'react';
import { Calendar, Users, Clock, Share2, CheckCircle } from 'lucide-react';
import HomePage from './components/HomePage';
import CreateMeeting from './components/CreateMeeting';
import JoinMeeting from './components/JoinMeeting';
import Results from './components/Results';

export type AppPage = 'home' | 'create' | 'join' | 'results';

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [meetingCode, setMeetingCode] = useState<string>('');

  // Check for meeting code in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setMeetingCode(code);
      setCurrentPage('join');
    }
  }, []);

  const navigateTo = (page: AppPage, code?: string) => {
    setCurrentPage(page);
    if (code) setMeetingCode(code);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'create':
        return <CreateMeeting onNavigate={navigateTo} />;
      case 'join':
        return <JoinMeeting onNavigate={navigateTo} meetingCode={meetingCode} />;
      case 'results':
        return <Results onNavigate={navigateTo} meetingCode={meetingCode} />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigateTo('home')}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MeetSync</h1>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>PDT</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App;