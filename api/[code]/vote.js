// Simple in-memory storage
let meetings = {};

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

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { code } = req.query;
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
      Object.keys(meeting.votes).forEach(slot => {
        meeting.votes[slot] = meeting.votes[slot].filter(voter => voter !== participantName);
      });
    } else {
      meeting.participants.push({
        name: participantName,
        joinedAt: new Date().toISOString()
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
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}