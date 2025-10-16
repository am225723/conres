const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.VITE_PUSHER_APP_ID,
  key: process.env.VITE_PUSHER_KEY,
  secret: process.env.VITE_PUSHER_SECRET,
  cluster: process.env.VITE_PUSHER_CLUSTER,
  useTLS: true
});

module.exports = async (req, res) => {
  const { message, sender, channel } = req.body;

  await pusher.trigger(channel, 'new-message', {
    message,
    sender
  });

  res.status(200).send('Message sent');
};