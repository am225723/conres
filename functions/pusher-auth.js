const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

exports.handler = (event, context, callback) => {
  const { socket_id, channel_name } = JSON.parse(event.body);
  const randomId = Math.random().toString(36).substring(2);

  const presenseData = {
    user_id: randomId,
    user_info: {
      name: 'User ' + randomId.substr(0, 4)
    }
  };

  const auth = pusher.authenticate(socket_id, channel_name, presenseData);
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(auth)
  });
};