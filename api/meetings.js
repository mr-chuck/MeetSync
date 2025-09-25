// api/meetings.js
export default function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Return sample meetings data
      const meetings = [
        {
          id: 1,
          title: "Daily Team Standup",
          date: "2025-09-25",
          time: "09:00",
          duration: 30,
          attendees: ["Alice Johnson", "Bob Smith", "Charlie Brown"],
          description: "Daily sync meeting to discuss progress and blockers",
          location: "Conference Room A"
        },
        {
          id: 2,
          title: "Client Project Review",
          date: "2025-09-26",
          time: "14:00", 
          duration: 60,
          attendees: ["Client Team", "Project Manager", "Lead Developer"],
          description: "Review project milestones and deliverables with client",
          location: "Main Conference Room"
        },
        {
          id: 3,
          title: "Sprint Planning",
          date: "2025-09-27",
          time: "10:00",
          duration: 90,
          attendees: ["Dev Team", "Product Owner", "Scrum Master"],
          description: "Plan upcoming sprint tasks and priorities",
          location: "Team Room"
        }
      ];

      res.status(200).json({ 
        success: true,
        meetings: meetings,
        count: meetings.length
      });

    } else if (req.method === 'POST') {
      // Handle creating new meeting
      const { title, date, time, duration, attendees, description, location } = req.body;
      
      // Validate required fields
      if (!title || !date || !time) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required fields: title, date, and time are required'
        });
      }

      // Create new meeting object
      const newMeeting = {
        id: Date.now(), // Simple ID generation using timestamp
        title: title.trim(),
        date: date,
        time: time,
        duration: duration || 60, // Default to 60 minutes
        attendees: Array.isArray(attendees) ? attendees : [],
        description: description || '',
        location: location || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // In a real application, you would save this to a database
      // For now, we'll just return the created meeting
      res.status(201).json({
        success: true,
        message: "Meeting created successfully!",
        meeting: newMeeting
      });

    } else if (req.method === 'PUT') {
      // Handle updating existing meeting
      const { id } = req.query;
      const { title, date, time, duration, attendees, description, location } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Meeting ID is required for updates'
        });
      }

      const updatedMeeting = {
        id: parseInt(id),
        title: title || 'Updated Meeting',
        date: date,
        time: time,
        duration: duration || 60,
        attendees: Array.isArray(attendees) ? attendees : [],
        description: description || '',
        location: location || '',
        updatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        message: "Meeting updated successfully!",
        meeting: updatedMeeting
      });

    } else if (req.method === 'DELETE') {
      // Handle deleting meeting
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Meeting ID is required for deletion'
        });
      }

      // In a real app, you'd delete from database
      res.status(200).json({
        success: true,
        message: `Meeting with ID ${id} deleted successfully!`
      });

    } else {
      // Method not allowed
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
      res.status(405).json({ 
        success: false,
        error: `Method ${req.method} is not allowed. Supported methods: GET, POST, PUT, DELETE`
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error occurred',
      details: error.message
    });
  }
} 
