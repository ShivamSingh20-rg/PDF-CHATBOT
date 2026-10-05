import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { generate , processPdf } from './chatbot.js';


const app = express();

app.use(cors());
app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
const PORT = process.env.PORT || 3001;

app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const sessionId = req.body.sessionId || 'default';
    const result = await processPdf(req.file.buffer, sessionId);

    res.status(200).json({
      message: 'PDF processed and indexed successfully!',
      chunksProcessed: result.chunkCount,
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

app.post('/api/clear-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    await clearSessionData(sessionId);
    res.status(200).json({ message: `Vectors cleared for session ${sessionId}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear session vectors' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, hasUploadedPdf, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Pass the boolean flag to determine whether to query Pinecone
    const aiResponse = await generate(message, Boolean(hasUploadedPdf), sessionId || 'default');

    res.status(200).json({ reply: aiResponse });
  } catch (error) {
    console.error('Error in chat route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is Running on Port :${PORT}`);
});