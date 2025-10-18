import { nanoid } from 'nanoid';

export default (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const sessionId = nanoid(10);
  res.status(200).json({ sessionId });
};
