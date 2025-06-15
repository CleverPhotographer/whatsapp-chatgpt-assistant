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

  console.log("Received message from:", userNumber);
  console.log("Message content:", userMessage);

  try {
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful photography assistant. Give practical, clear answers about camera settings, shooting conditions, creative ideas, and gear for photographers on location.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const reply = chatResponse.choices[0].message.content;

    await client.messages.create({
      body: reply,
      from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
      to: userNumber,
    });

    res.status(200).end();
  } catch (error) {
    console.error("Error handling message:", error);

    await client.messages.create({
      body: 'Oops! Something went wrong while processing your message. Please try again later.',
      from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
      to: userNumber,
    });

    res.status(500).send('Internal Server Error');
  }
};
