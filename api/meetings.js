// Simple in-memory storage
let meetings = {};

// Generate random 6-character code
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.json(meetings);
    return;
  }

  if (req.method === 'POST') {
    const { name, timeSlots } = req.body;
    
    if (!name || !timeSlots || timeSlots.length === 0) {
      return res.status(400).json({ error: 'Meeting name and time slots are required' });
    }

    const code = generateCode();
    const meeting = {
      id: code,
      name,
      timeSlots,
      participants: [],
      votes: {},
      createdAt: new Date().toISOString()
    };

    // Initialize vote counts for each time slot
    timeSlots.forEach(slot => {
      meeting.votes[slot] = [];
    });

    meetings[code] = meeting;
    
    res.json({ 
      code,
      meeting,
      joinUrl: `https://meetsync-nine.vercel.app`
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}