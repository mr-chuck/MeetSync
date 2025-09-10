const getMeetings = () => {
  if (typeof global !== 'undefined') {
    global.meetings = global.meetings || {};
    return global.meetings;
  }
  return {};
};

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
    
    res.json(meeting);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}