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

  console.log("📩 Received message from:", userNumber);
  console.log("💬 Message content:", userMessage);

  try {
    console.log("🔁 Sending request to OpenAI...");

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful photography assistant. Give practical, clear advice on camera settings, techniques, and creativity.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    let reply = chatResponse.choices[0].message.content;
    console.log("✅ OpenAI response received.");

    // ✂️ Trim to fit Twilio’s 1600 character WhatsApp limit
    if (reply.length > 1500) {
      reply = reply.slice(0, 1497) + '...';
      console.log("✂️ Reply truncated to 1500 characters.");
    }

    console.log("📤 Sending reply to WhatsApp via Twilio...");

    await client.messages.create({
      body: reply,
      from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
      to: userNumber,
    });

    console.log("📨 Reply sent to user.");
    res.status(200).end();
  } catch (error) {
    console.error("❌ Error handling message:", error);

    try {
      await client.messages.create({
        body: '⚠️ Something went wrong while processing your request. Please try again later.',
        from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
        to: userNumber,
      });
    } catch (twilioError) {
      console.error("❌ Failed to send fallback message:", twilioError);
    }

    res.status(500).send('Internal Server Error');
  }
};
