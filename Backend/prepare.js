import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { Pinecone } from "@pinecone-database/pinecone";

const embeddings = new HuggingFaceTransformersEmbeddings({
  model: "Xenova/bge-small-en-v1.5",
}); 

const pinecone = new Pinecone({
  apiKey:"pcsk_2sCrpb_MUeLyBWeFK8awy75vhWiATwXxCa1XZkDa3UPv2uWtyMyCVdR9AVEYFCGo1JaEmN",
});

const pineconeIndex = pinecone.Index("sampleone");

export async function preparePDF(filePath) {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();

  console.log(`Loaded PDF pages: ${docs.length}`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
    chunkOverlap: 200,
  });

  const splitDocs = await splitter.splitDocuments(docs);
  console.log(`Generated Chunks Count: ${splitDocs.length}`);
 

  const BATCH_SIZE = 3;

  for (let i = 0; i < splitDocs.length; i += BATCH_SIZE) {
    const batch = splitDocs.slice(i, i + BATCH_SIZE);
    console.log(
      `\n--- Processing Batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
        splitDocs.length / BATCH_SIZE
      )} ---`
    );

    const texts = batch.map((doc) => doc.pageContent);

     
    const rawVectors = await embeddings.embedDocuments(texts);
    console.log(`Generated raw vectors count: ${rawVectors ? rawVectors.length : 0}`);

    if (!rawVectors || rawVectors.length === 0) {
      console.error("Embeddings output was empty for this batch, skipping upsert.");
      continue;
    }

    
    const records = batch.map((doc, idx) => {
      const vector = Array.isArray(rawVectors[idx])
        ? rawVectors[idx]
        : Array.from(rawVectors[idx]);

      return {
        id: `vec_${i + idx}_${Date.now()}`,
        values: vector,
        metadata: {
          text: doc.pageContent,
        },
      };
    });

    console.log(`Uploading ${records.length} records to Pinecone...`);
 
    if (records.length > 0) {
      await pineconeIndex.upsert({ records });
      console.log("Batch successfully upserted!");
    }
  }

  console.log("\nPDF vectors successfully indexed in Pinecone!");
  return splitDocs;
}




  