const getMeetings = () => {
  if (typeof global !== 'undefined') {
    global.meetings = global.meetings || {};
    return global.meetings;
  }
  return {};
};

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const { code } = req.query;
    const meetings = getMeetings();
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
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}