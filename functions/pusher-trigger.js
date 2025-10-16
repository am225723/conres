const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

exports.handler = (event, context, callback) => {
  const { channel, message } = JSON.parse(event.body);
  pusher.trigger(channel, 'message', message);
  callback(null, {
    statusCode: 200,
    body: 'Message sent'
  });
};