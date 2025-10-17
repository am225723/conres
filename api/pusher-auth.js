const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.VITE_PUSHER_APP_ID,
  key: process.env.VITE_PUSHER_KEY,
  secret: process.env.VITE_PUSHER_SECRET,
  cluster: process.env.VITE_PUSHER_CLUSTER,
  useTLS: true
});

module.exports = (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const userId = req.body.userId;

  const presenseData = {
    user_id: userId,
    user_info: {},
  };

  const auth = pusher.authenticate(socketId, channel, presenseData);
  res.send(auth);
};