// API service for meeting management
const API_BASE_URL = 'https://api.meetsync.app'; // Replace with actual API endpoint

export interface Meeting {
  id: string;
  name: string;
  creatorName: string;
  timeSlots: string[];
  participants: Array<{ name: string; joinedAt: string }>;
  votes: Record<string, string[]>;
  createdAt: string;
}

export interface CreateMeetingRequest {
  name: string;
  dates: string[];
  startTime: string;
  endTime: string;
  creatorName: string;
}

export interface CreateMeetingResponse {
  code: string;
  meeting: Meeting;
}

export interface VoteRequest {
  participantName: string;
  availableSlots: string[];
}

export interface BestSlot {
  slot: string;
  votes: number;
  percentage: number;
}

export interface VoteSummary {
  slot: string;
  votes: number;
  voters: string[];
}

export interface ResultsResponse {
  meeting: Meeting;
  bestSlots: BestSlot[];
  votesSummary: VoteSummary[];
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Fallback to mock API for development
        return this.mockRequest<T>(endpoint, options);
      }
      throw error;
    }
  }

  // Mock API for development/testing
  private async mockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (endpoint === '/api/meetings' && options.method === 'POST') {
      const body = JSON.parse(options.body as string) as CreateMeetingRequest;
      const code = this.generateMockCode();
      
      // Generate time slots from dates and time range
      const timeSlots: string[] = [];
      body.dates.forEach(dateStr => {
        const [startHour, startMinute] = body.startTime.split(':').map(Number);
        const [endHour, endMinute] = body.endTime.split(':').map(Number);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
          const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          // Create proper ISO string in PDT timezone
          const dateTime = new Date(`${dateStr}T${timeStr}:00-07:00`).toISOString();
          timeSlots.push(dateTime);
          
          currentMinute += 30;
          if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour += 1;
          }
        }
      });
      
      const meeting: Meeting = {
        id: code,
        name: body.name,
        creatorName: body.creatorName,
        timeSlots,
        participants: [],
        votes: {},
        createdAt: new Date().toISOString()
      };

      // Initialize vote counts for each time slot
      timeSlots.forEach(slot => {
        meeting.votes[slot] = [];
      });

      // Store in localStorage for persistence during development
      const meetings = this.getMockMeetings();
      meetings[code] = meeting;
      localStorage.setItem('mockMeetings', JSON.stringify(meetings));

      return { code, meeting } as T;
    }

    // Get meeting by code
    if (endpoint.startsWith('/api/meetings/') && options.method !== 'POST' && !endpoint.includes('/vote') && !endpoint.includes('/results')) {
      const code = endpoint.split('/')[3];
      const meetings = this.getMockMeetings();
      const meeting = meetings[code];

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      return meeting as T;
    }

    if (endpoint.startsWith('/api/meetings/') && endpoint.endsWith('/vote') && options.method === 'POST') {
      const code = endpoint.split('/')[3];
      const body = JSON.parse(options.body as string) as VoteRequest;
      const meetings = this.getMockMeetings();
      const meeting = meetings[code];

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Remove existing votes from this participant
      const existingParticipant = meeting.participants.find(p => p.name === body.participantName);
      if (existingParticipant) {
        Object.keys(meeting.votes).forEach(slot => {
          meeting.votes[slot] = meeting.votes[slot].filter(voter => voter !== body.participantName);
        });
      } else {
        meeting.participants.push({
          name: body.participantName,
          joinedAt: new Date().toISOString()
        });
      }

      // Add new votes
      body.availableSlots.forEach(slot => {
        if (meeting.votes[slot]) {
          meeting.votes[slot].push(body.participantName);
        }
      });

      meetings[code] = meeting;
      localStorage.setItem('mockMeetings', JSON.stringify(meetings));

      return { 
        success: true, 
        meeting: {
          ...meeting,
          bestSlots: this.getBestSlots(meeting)
        }
      } as T;
    }

    if (endpoint.startsWith('/api/meetings/') && endpoint.endsWith('/results')) {
      const code = endpoint.split('/')[3];
      const meetings = this.getMockMeetings();
      const meeting = meetings[code];

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const results: ResultsResponse = {
        meeting,
        bestSlots: this.getBestSlots(meeting),
        votesSummary: Object.keys(meeting.votes).map(slot => ({
          slot,
          votes: meeting.votes[slot].length,
          voters: meeting.votes[slot]
        })).sort((a, b) => b.votes - a.votes)
      };

      console.log('Results response:', results);
      return results as T;
    }

    throw new Error(`Mock endpoint not implemented: ${endpoint}`);
  }

  private getMockMeetings(): Record<string, Meeting> {
    const stored = localStorage.getItem('mockMeetings');
    return stored ? JSON.parse(stored) : {};
  }

  private generateMockCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private getBestSlots(meeting: Meeting): BestSlot[] {
    if (meeting.participants.length === 0) return [];
    
    console.log('Calculating best slots for meeting:', meeting);
    console.log('Meeting votes:', meeting.votes);
    
    const slotVotes = Object.keys(meeting.votes).map(slot => ({
      slot,
      votes: meeting.votes[slot].length,
      percentage: Math.round((meeting.votes[slot].length / meeting.participants.length) * 100)
    }));
    
    console.log('Slot votes calculated:', slotVotes);
    
    const maxVotes = Math.max(...slotVotes.map(s => s.votes));
    const bestSlots = slotVotes.filter(s => s.votes === maxVotes && s.votes > 0);
    
    console.log('Best slots:', bestSlots);
    return bestSlots;
  }

  // Public API methods
  async createMeeting(data: CreateMeetingRequest): Promise<CreateMeetingResponse> {
    return this.request<CreateMeetingResponse>('/api/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMeeting(code: string): Promise<Meeting> {
    return this.request<Meeting>(`/api/meetings/${code}`);
  }

  async submitVote(code: string, data: VoteRequest): Promise<{ success: boolean; meeting: Meeting }> {
    return this.request<{ success: boolean; meeting: Meeting }>(`/api/meetings/${code}/vote`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getResults(code: string): Promise<ResultsResponse> {
    return this.request<ResultsResponse>(`/api/meetings/${code}/results`);
  }
}

export const apiService = new ApiService();