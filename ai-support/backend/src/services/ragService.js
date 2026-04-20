const OpenAI = require('openai');
const { generateEmbedding, isDemoMode } = require('./embeddingService');
const { similaritySearch, keywordSearch } = require('./vectorService');
const { generateDemoAnswer, generateDemoAnswerStream } = require('./demoService');
const DocumentChunk = require('../models/DocumentChunk');

let openaiClient = null;
const getClient = () => {
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
};

/** Check if company has any indexed documents */
const hasDocuments = async (companyId) => {
  const count = await DocumentChunk.countDocuments({ company: companyId });
  return count > 0;
};

/**
 * Build the system prompt incorporating company data and context.
 */
const buildSystemPrompt = (company, contextChunks) => {
  const contextText = contextChunks.length > 0
    ? contextChunks.map((c, i) =>
        `[Source ${i + 1}: ${c.metadata?.documentName || 'Knowledge Base'}]\n${c.content}`
      ).join('\n\n---\n\n')
    : 'No relevant context found in the knowledge base.';

  return `${company.systemPrompt}

IMPORTANT INSTRUCTIONS:
- Answer ONLY based on the context provided below
- If the context doesn't contain enough information to answer, say: "I don't have information about that in my knowledge base. Please contact our support team for help."
- Never make up information not present in the context
- Be concise, friendly, and professional
- If sources are available, you may reference them naturally

KNOWLEDGE BASE CONTEXT:
${contextText}`;
};

/**
 * Build conversation history for the LLM (last N messages for context).
 */
const buildMessageHistory = (previousMessages, maxMessages = 10) => {
  return previousMessages
    .slice(-maxMessages)
    .map(msg => ({ role: msg.role, content: msg.content }));
};

/**
 * RAG pipeline - non-streaming version.
 */
const generateAnswer = async ({ company, userMessage, previousMessages = [] }) => {
  const startTime = Date.now();

  // Demo mode with no documents → use keyword-matched static responses
  if (isDemoMode() && !(await hasDocuments(company._id))) {
    const answer = generateDemoAnswer(userMessage);
    return { answer, sourcesUsed: [], tokenUsage: null, responseTimeMs: Date.now() - startTime, demoMode: true };
  }

  // Demo mode WITH uploaded documents → use keyword search against real chunks
  if (isDemoMode()) {
    const contextChunks = await keywordSearch({ companyId: company._id, queryText: userMessage, topK: 5 });
    const answer = contextChunks.length > 0
      ? `Based on your knowledge base:\n\n${contextChunks[0].content}\n\n*(Demo mode — add an OpenAI key for full AI answers)*`
      : generateDemoAnswer(userMessage);
    return {
      answer, demoMode: true, tokenUsage: null,
      responseTimeMs: Date.now() - startTime,
      sourcesUsed: contextChunks.map(c => ({
        documentName: c.metadata?.documentName,
        chunkContent: c.content.slice(0, 200),
        similarity: c.similarity,
      })),
    };
  }

  // Step 1: Embed the user query
  const queryEmbedding = await generateEmbedding(userMessage);

  // Step 2: Retrieve relevant chunks
  const contextChunks = await similaritySearch({
    companyId: company._id,
    queryEmbedding,
    topK: parseInt(process.env.MAX_CONTEXT_CHUNKS) || 5,
    minScore: 0.25,
  });

  // Step 3: Build prompt
  const systemPrompt = buildSystemPrompt(company, contextChunks);
  const history = buildMessageHistory(previousMessages);

  // Step 4: Call LLM
  const client = getClient();
  const response = await client.chat.completions.create({
    model: process.env.CHAT_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ],
    max_tokens: parseInt(process.env.MAX_TOKENS) || 1000,
    temperature: 0.3,
  });

  const answer = response.choices[0].message.content;
  const tokenUsage = response.usage;
  const responseTimeMs = Date.now() - startTime;

  return {
    answer,
    sourcesUsed: contextChunks.map(c => ({
      documentId: c.document?._id,
      documentName: c.metadata?.documentName,
      chunkContent: c.content.slice(0, 200) + (c.content.length > 200 ? '...' : ''),
      similarity: Math.round(c.similarity * 100) / 100,
    })),
    tokenUsage: {
      promptTokens: tokenUsage.prompt_tokens,
      completionTokens: tokenUsage.completion_tokens,
      totalTokens: tokenUsage.total_tokens,
    },
    responseTimeMs,
  };
};

/**
 * RAG pipeline - streaming version using Server-Sent Events.
 * Calls onChunk(text) for each streamed token, returns final result.
 */
const generateAnswerStream = async ({ company, userMessage, previousMessages = [], onChunk }) => {
  const startTime = Date.now();

  if (isDemoMode() && !(await hasDocuments(company._id))) {
    return generateDemoAnswerStream({ userMessage, onChunk });
  }

  if (isDemoMode()) {
    const contextChunks = await keywordSearch({ companyId: company._id, queryText: userMessage, topK: 5 });
    const answer = contextChunks.length > 0
      ? `Based on your knowledge base:\n\n${contextChunks[0].content}\n\n*(Demo mode — add an OpenAI key for full AI answers)*`
      : generateDemoAnswer(userMessage);
    const words = answer.split(' ');
    for (let i = 0; i < words.length; i++) {
      onChunk((i === 0 ? '' : ' ') + words[i]);
      await new Promise(r => setTimeout(r, 20));
    }
    return {
      answer, demoMode: true, tokenUsage: null,
      responseTimeMs: Date.now() - startTime,
      sourcesUsed: contextChunks.map(c => ({
        documentName: c.metadata?.documentName,
        chunkContent: c.content.slice(0, 200),
        similarity: c.similarity,
      })),
    };
  }

  // Step 1: Embed the user query
  const queryEmbedding = await generateEmbedding(userMessage);

  // Step 2: Retrieve relevant chunks
  const contextChunks = await similaritySearch({
    companyId: company._id,
    queryEmbedding,
    topK: parseInt(process.env.MAX_CONTEXT_CHUNKS) || 5,
    minScore: 0.25,
  });

  // Step 3: Build prompt
  const systemPrompt = buildSystemPrompt(company, contextChunks);
  const history = buildMessageHistory(previousMessages);

  // Step 4: Stream from LLM
  const client = getClient();
  const stream = await client.chat.completions.create({
    model: process.env.CHAT_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ],
    max_tokens: parseInt(process.env.MAX_TOKENS) || 1000,
    temperature: 0.3,
    stream: true,
    stream_options: { include_usage: true },
  });

  let fullContent = '';
  let tokenUsage = null;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullContent += delta;
      onChunk(delta);
    }
    if (chunk.usage) {
      tokenUsage = chunk.usage;
    }
  }

  return {
    answer: fullContent,
    sourcesUsed: contextChunks.map(c => ({
      documentId: c.document?._id,
      documentName: c.metadata?.documentName,
      chunkContent: c.content.slice(0, 200) + (c.content.length > 200 ? '...' : ''),
      similarity: Math.round(c.similarity * 100) / 100,
    })),
    tokenUsage: tokenUsage ? {
      promptTokens: tokenUsage.prompt_tokens,
      completionTokens: tokenUsage.completion_tokens,
      totalTokens: tokenUsage.total_tokens,
    } : null,
    responseTimeMs: Date.now() - startTime,
  };
};

module.exports = { generateAnswer, generateAnswerStream };
