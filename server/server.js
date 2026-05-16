require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/stadiums', require('./routes/stadium.routes'));
app.use('/api/pitches', require('./routes/pitch.routes'));
app.use('/api/slots', require('./routes/slot.routes'));
app.use('/api/reservations', require('./routes/reservation.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/stats', require('./routes/stats.routes'));

app.use((err, req, res, next) => {
  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`[server] listening on ${PORT}`)))
  .catch((e) => {
    console.error('[server] failed to start', e);
    process.exit(1);
  });
