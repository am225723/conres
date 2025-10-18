import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.VITE_PUSHER_APP_ID,
  key: process.env.VITE_PUSHER_KEY,
  secret: process.env.VITE_PUSHER_SECRET,
  cluster: process.env.VITE_PUSHER_CLUSTER,
  useTLS: true
});

export default (req, res) => {
  try {
    // Validate required parameters
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { socket_id: socketId, channel_name: channel, userId } = req.body;

    if (!socketId) {
      return res.status(400).json({ error: 'Missing socket_id parameter' });
    }

    if (!channel) {
      return res.status(400).json({ error: 'Missing channel_name parameter' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const presenseData = {
      user_id: userId,
      user_info: {},
     };

    const auth = pusher.authenticate(socketId, channel, presenseData);
    res.send(auth);
  } catch (error) {
    console.error('Pusher authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
