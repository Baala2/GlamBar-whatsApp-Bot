const express = require('express');
const axios = require('axios');
require('dotenv').config();
const app = express();
app.use(express.json());

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const VERIFY = process.env.VERIFY_TOKEN || 'glambar123';

let orders = [];

// Webhook Verify
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY) {
    return res.send(req.query['hub.challenge']);
  }
  res.sendStatus(403);
});

// Receive Messages
app.post('/webhook', async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return res.sendStatus(200);
    const from = msg.from;
    const text = msg.text?.body?.trim().toLowerCase() || '';

    let reply = '';
    if (text.includes('hi') || text.includes('hello') || text === '1') {
      reply = `Welcome to GlamBar! 💄✨\n\n1. View Menu\n2. Book Appointment\n3. Track Order\n\nReply with number`;
    } else if (text === '2') {
      reply = `Our Menu:\n💅 Nails - 30k\n💇 Hair - 50k\n💄 Makeup - 80k\n\nReply BOOK + Service\nExample: BOOK Nails`;
    } else if (text.startsWith('book')) {
      const id = 'GB' + Math.floor(1000 + Math.random() * 9000);
      orders.push({ id, from, service: text, time: new Date().toLocaleString() });
      reply = `✅ Booked! Your ID: ${id}\nWe will confirm shortly. Thank you!`;
    } else if (text === '3') {
      reply = `Send your Order ID like GB1234 to track`;
    } else {
      reply = `Hi! Welcome to GlamBar 💄\nReply 1 for Menu, 2 for Booking`;
    }
    await axios.post(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
      messaging_product: 'whatsapp', to: from, text: { body: reply }
    }, { headers: { Authorization: `Bearer ${TOKEN}` } });
  } catch (e) { console.log(e.message); }
  res.sendStatus(200);
});

app.get('/admin', (req, res) => {
  let html = `<h1>GlamBar Orders (${orders.length})</h1>`;
  orders.forEach(o => { html += `<p>${o.id} - ${o.service} - ${o.from} - ${o.time}</p>`; });
  res.send(html);
});

app.get('/api/orders', (req, res) => res.json(orders));
app.get('/', (req, res) => res.send('GlamBar Bot Running ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Running on ' + PORT));
