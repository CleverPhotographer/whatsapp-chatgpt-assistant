const axios = require('axios');
const { OpenAI } = require('openai');
const twilio = require('twilio');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const userMessage = req.body.Body;
  const userNumber = req.body.From;

  const authorizedNumbers = [process.env.AUTHORIZED_NUMBER];
  if (!authorizedNumbers.includes(userNumber)) {
    await client.messages.create({
      body: 'You are not authorized yet. Please subscribe.',
      from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
      to: userNumber,
    });
    res.status(200).end();
    return;
  }

  const chatResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a photography assistant, provide practical advice on camera settings and locations.' },
      { role: 'user', content: userMessage },
    ],
  });

  const reply = chatResponse.choices[0].message.content;

  await client.messages.create({
    body: reply,
    from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
    to: userNumber,
  });

  res.status(200).end();
};
