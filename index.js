import 'dotenv/config';
import app from './src/app.js';

const port = Number(process.env.PORT) || 3000;

// Render assigns PORT and expects the app to listen on 0.0.0.0 (all interfaces)
app.listen(port, '0.0.0.0', () => {
  console.log(`Finance API listening on http://0.0.0.0:${port}`);
});
