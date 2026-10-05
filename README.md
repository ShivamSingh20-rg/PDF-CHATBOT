# 📚 RAG PDF Reader

A full-stack **RAG-based PDF Reader & Q&A application** that allows users to upload PDFs and ask questions based on their content.

## 🛠️ Tech Stack

* **Frontend:** React.js, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Vector DB:** Vector Database
* **AI:** LLM + Embeddings + RAG

## 🔄 How It Works

```text
PDF → Text Extraction → Chunking → Embeddings → Vector DB
                                      ↓
Question → Semantic Search → Relevant Context → LLM → Answer
```

## ✨ Features

* PDF upload & reading
* AI-powered Q&A
* Semantic/vector search
* RAG pipeline
* Document management
* User authentication

## ⚙️ Setup

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
npm run dev
```

Create `.env` with your MongoDB, LLM, and Vector DB credentials.

## 🎯 Purpose

Helps users quickly **understand, search, and ask questions about large PDF documents** using RAG and semantic search.

## 👨‍💻 Author

**Your Name**
