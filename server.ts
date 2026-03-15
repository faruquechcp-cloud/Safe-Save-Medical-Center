import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());
  app.use(session({
    secret: 'safesave-secret-key-' + Math.random().toString(36),
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: true, 
      sameSite: 'none',
      httpOnly: true 
    }
  }));

  const getOAuth2Client = () => {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.APP_URL}/auth/google/callback`
    );
  };

  // API Routes
  app.get('/api/auth/google/url', (_req: Request, res: Response) => {
    const missing = [];
    if (!process.env.GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
    if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
    if (!process.env.APP_URL) missing.push('APP_URL');

    if (missing.length > 0) {
      return res.status(400).json({ 
        error: `Environment variables missing: ${missing.join(', ')}. Please check your .env file and restart the server.` 
      });
    }

    try {
      const oauth2Client = getOAuth2Client();
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file'],
        prompt: 'consent'
      });
      res.json({ url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/auth/google/callback', async (req: Request, res: Response) => {
    const { code } = req.query;
    try {
      const oauth2Client = getOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code as string);
      
      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f2f5;">
            <div style="text-align: center; padding: 40px; background: white; border-radius: 20px; shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <h2 style="color: #1a73e8;">Authentication Successful!</h2>
              <p style="color: #5f6368;">This window will close automatically.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'GOOGLE_AUTH_SUCCESS', 
                    tokens: ${JSON.stringify(tokens)} 
                  }, '*');
                  setTimeout(() => window.close(), 1000);
                } else {
                  window.location.href = '/';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      res.status(500).send('Authentication failed. Please try again.');
    }
  });

  app.post('/api/backup/upload', async (req: Request, res: Response) => {
    const { tokens, fileName, content } = req.body;
    if (!tokens || !content) {
      return res.status(400).json({ error: 'Missing tokens or content' });
    }

    try {
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials(tokens);

      const drive = google.drive({ version: 'v3', auth });
      
      const fileMetadata = {
        name: fileName || `SafeSave_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
        mimeType: 'application/json'
      };
      
      const media = {
        mimeType: 'application/json',
        body: content
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id'
      });

      res.json({ success: true, fileId: response.data.id });
    } catch (error: any) {
      console.error('Error uploading to Drive:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/backup/list', async (req: Request, res: Response) => {
    const { tokens } = req.body;
    if (!tokens) return res.status(400).json({ error: 'Missing tokens' });

    try {
      const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
      auth.setCredentials(tokens);
      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.list({
        q: "name contains 'SafeSave_Backup_' and mimeType = 'application/json' and trashed = false",
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc',
        pageSize: 10
      });

      res.json({ success: true, files: response.data.files });
    } catch (error: any) {
      console.error('Error listing Drive files:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/backup/download', async (req: Request, res: Response) => {
    const { tokens, fileId } = req.body;
    if (!tokens || !fileId) return res.status(400).json({ error: 'Missing tokens or fileId' });

    try {
      const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
      auth.setCredentials(tokens);
      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      res.json({ success: true, content: response.data });
    } catch (error: any) {
      console.error('Error downloading from Drive:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
