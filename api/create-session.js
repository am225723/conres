import { nanoid } from 'nanoid';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const sessionId = nanoid(10); // Generate a 10-character unique ID
    res.status(200).json({ sessionId });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}