import express from 'express';
import cors from 'cors';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
let meetings = {};

// Generate random 6-character code
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get all meetings (for debugging)
app.get('/api/meetings', (req, res) => {
  res.json(meetings);
});

// Create a new meeting
app.post('/api/meetings', (req, res) => {
  const { name, dates, startTime, endTime, creatorName } = req.body;
  
  if (!name || !dates || dates.length === 0 || !startTime || !endTime || !creatorName) {
    return res.status(400).json({ error: 'Meeting name, creator name, dates, and time range are required' });
  }

  // Generate time slots from dates and time range
  const timeSlots = [];
  dates.forEach(dateStr => {
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    const endHour = parseInt(endTime.split(':')[0]);
    const endMinute = parseInt(endTime.split(':')[1]);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      const dateTime = dayjs.tz(`${dateStr} ${timeStr}`, 'America/Los_Angeles').toISOString();
      timeSlots.push(dateTime);
      
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
    }
  });

  const code = generateCode();
  const meeting = {
    id: code,
    name,
    creatorName,
    timeSlots,
    participants: [],
    votes: {},
    createdAt: dayjs().tz('America/Los_Angeles').toISOString()
  };

  // Initialize vote counts for each time slot
  timeSlots.forEach(slot => {
    meeting.votes[slot] = [];
  });

  meetings[code] = meeting;
  
  res.json({ 
    code,
    meeting
  });
});

// Get meeting by code
app.get('/api/meetings/:code', (req, res) => {
  const { code } = req.params;
  const meeting = meetings[code.toUpperCase()];
  
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }
  
  res.json(meeting);
});

// Submit participant availability
app.post('/api/meetings/:code/vote', (req, res) => {
  const { code } = req.params;
  const { participantName, availableSlots } = req.body;
  
  if (!participantName || !availableSlots) {
    return res.status(400).json({ error: 'Participant name and available slots are required' });
  }

  const meeting = meetings[code.toUpperCase()];
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  // Remove existing votes from this participant
  const existingParticipant = meeting.participants.find(p => p.name === participantName);
  if (existingParticipant) {
    // Remove previous votes
    Object.keys(meeting.votes).forEach(slot => {
      meeting.votes[slot] = meeting.votes[slot].filter(voter => voter !== participantName);
    });
  } else {
    // Add new participant
    meeting.participants.push({
      name: participantName,
      joinedAt: dayjs().tz('America/Los_Angeles').toISOString()
    });
  }

  // Add new votes
  availableSlots.forEach(slot => {
    if (meeting.votes[slot]) {
      meeting.votes[slot].push(participantName);
    }
  });

  res.json({ 
    success: true, 
    meeting: {
      ...meeting,
      bestSlots: getBestSlots(meeting)
    }
  });
});

// Get meeting results
app.get('/api/meetings/:code/results', (req, res) => {
  const { code } = req.params;
  const meeting = meetings[code.toUpperCase()];
  
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }
  
  const results = {
    meeting,
    bestSlots: getBestSlots(meeting),
    votesSummary: Object.keys(meeting.votes).map(slot => ({
      slot,
      votes: meeting.votes[slot].length,
      voters: meeting.votes[slot]
    })).sort((a, b) => b.votes - a.votes)
  };
  
  res.json(results);
});

function getBestSlots(meeting) {
  if (meeting.participants.length === 0) return [];
  
  const slotVotes = Object.keys(meeting.votes).map(slot => ({
    slot,
    votes: meeting.votes[slot].length,
    percentage: Math.round((meeting.votes[slot].length / meeting.participants.length) * 100)
  }));
  
  const maxVotes = Math.max(...slotVotes.map(s => s.votes));
  return slotVotes.filter(s => s.votes === maxVotes && s.votes > 0);
}

app.listen(PORT, () => {
  console.log(`MeetSync server running on port ${PORT}`);
});