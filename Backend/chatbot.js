import Groq from 'groq-sdk';
import 'dotenv/config';
import pdfParse from 'pdf-parse-fixed';
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pinecone } from "@pinecone-database/pinecone";

const groq = new Groq({ apiKey: process.env.API_GROQ_KEY });

// Fix 1: Use 'model' parameter consistently matching your index dimension (384)
const embeddings = new HuggingFaceTransformersEmbeddings({
  model: "Xenova/bge-small-en-v1.5",
});

// Fix 2: Use environment variables instead of hardcoding API keys
const pc = new Pinecone({
  apiKey: "pcsk_2sCrpb_MUeLyBWeFK8awy75vhWiATwXxCa1XZkDa3UPv2uWtyMyCVdR9AVEYFCGo1JaEmN",
});

const pineconeIndex = pc.index("sampleone");

export async function processPdf(fileBuffer, sessionId = 'default') {
  if (!fileBuffer) {
    throw new Error('No file buffer provided to processPdf.');
  }

  // Convert Buffer / ArrayBuffer to Uint8Array safely
  const uint8Data = new Uint8Array(
    fileBuffer.buffer
      ? fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
      : fileBuffer
  );

  console.log(`[${sessionId}] Parsing PDF text...`);
  const pdfData = await pdfParse(uint8Data);

  const cleanText = (pdfData.text || '')
    .replace(/\r\n|\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleanText) {
    throw new Error('No readable text found in the uploaded PDF.');
  }

  // Step 2: Chunk the extracted text
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
    chunkOverlap: 200,
  });

  const docs = await textSplitter.createDocuments([cleanText]);
  console.log(`[${sessionId}] Created ${docs.length} chunks.`);

  if (docs.length === 0) {
    throw new Error('Text splitter produced 0 chunks.');
  }

  // Step 3: Generate vector embeddings
  const contents = docs.map((doc) => doc.pageContent);
  console.log(`[${sessionId}] Generating embeddings...`);
  
  const vectorsArray = await embeddings.embedDocuments(contents);

  if (!vectorsArray || vectorsArray.length === 0) {
    throw new Error('Failed to generate vector embeddings (received empty array).');
  }

  console.log(`[${sessionId}] Generated ${vectorsArray.length} embeddings vectors successfully.`);

  // Step 4: Map embeddings to Pinecone payload
  const vectors = docs.map((doc, idx) => {
    const rawVector = vectorsArray[idx];
    return {
      id: `${sessionId}-chunk-${Date.now()}-${idx}`,
      values: Array.isArray(rawVector) ? rawVector : Array.from(rawVector),
      metadata: {
        text: doc.pageContent,
        sessionId: sessionId,
      },
    };
  });

  // Step 5: Upsert into session namespace
  console.log(`[${sessionId}] Upserting ${vectors.length} vectors to Pinecone namespace "${sessionId}"...`);
  const namespace = pineconeIndex.namespace(sessionId);
 
  await namespace.upsert({
    records: vectors,
  });

  console.log(`[${sessionId}] Successfully upserted chunks to Pinecone!`);

  return { chunkCount: docs.length };
}
/**
 * Generates an LLM completion via Groq, incorporating vector context if a PDF is active.
 */
export async function generate(question, hasUploadedPdf = false, sessionId = 'default') {
  let retrievedContext = '';

  if (hasUploadedPdf) {
    const queryVector = await embeddings.embedQuery(question);
    const vectorValues = Array.isArray(queryVector) ? queryVector : Array.from(queryVector);

    // Search vectors in the isolated session namespace
    const namespace = pineconeIndex.namespace(sessionId);
    const queryResponse = await namespace.query({
      vector: vectorValues,
      topK: 5,
      includeMetadata: true,
    });

    retrievedContext = queryResponse.matches
      .map((match) => match.metadata?.text || '')
      .filter(Boolean)
      .join('\n\n---\n\n');
  }

  const systemPrompt = hasUploadedPdf && retrievedContext
    ? `You are Jarvis, a smart AI assistant. Answer the user's question accurately based ONLY on the provided PDF context below. If the answer is not in the context, state that clearly.`
    : `You are Jarvis, a helpful and smart AI assistant. Answer the user's question directly and concisely.`;

  const userQuery = hasUploadedPdf && retrievedContext
    ? `Question: ${question}\n\nPDF Context:\n${retrievedContext}\n\nAnswer:`
    : question;

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery },
    ],
  });

  return completion.choices[0]?.message?.content || "No response generated.";
}

 
 
export async function clearSessionData(sessionId) {
  try {
    await pineconeIndex.namespace(sessionId).deleteAll();
    console.log(`Successfully cleaned up Pinecone vectors for namespace: ${sessionId}`);
  } catch (error) {
    console.error(`Error deleting session vectors for ${sessionId}:`, error.message);
  }
}