/**
 * Demo/Mock AI service — runs when no valid OpenAI key is configured.
 * Returns intelligent keyword-matched responses so the UI is fully functional.
 */

const DEMO_RESPONSES = [
  {
    keywords: ['pricing', 'price', 'cost', 'plan', 'subscription', 'pay', 'free', 'paid'],
    response: `We offer flexible pricing plans to fit every team:\n\n**Free** — Up to 100 conversations/month, 1 knowledge base document\n\n**Starter ($29/mo)** — 1,000 conversations, 10 documents, email support\n\n**Pro ($79/mo)** — Unlimited conversations, unlimited documents, priority support, custom AI persona\n\n**Enterprise** — Custom pricing, SSO, dedicated support, SLA guarantees\n\nAll plans include a 14-day free trial. Would you like more details on any specific plan?`,
  },
  {
    keywords: ['feature', 'features', 'what can', 'capabilities', 'does it', 'support'],
    response: `SupportAI comes packed with powerful features:\n\n- **AI Chat Widget** — Embed on any website in minutes\n- **RAG Pipeline** — Answers from *your* documents only\n- **Knowledge Base** — Upload PDFs, FAQs, text files\n- **Streaming Responses** — Real-time token streaming\n- **Conversation History** — Full chat logs with analytics\n- **Feedback System** — Thumbs up/down on every response\n- **Multi-tenant** — One platform, multiple companies\n- **Custom AI Persona** — Edit the system prompt\n\nIs there a specific feature you'd like to know more about?`,
  },
  {
    keywords: ['start', 'started', 'begin', 'setup', 'install', 'integrate', 'how to'],
    response: `Getting started with SupportAI takes under 5 minutes:\n\n**Step 1** — Sign up and create your account at our dashboard\n\n**Step 2** — Upload your knowledge base (PDF, FAQ, or text files)\n\n**Step 3** — Wait ~30 seconds for AI processing to complete\n\n**Step 4** — Copy your unique chat widget URL and share it with customers\n\nThat's it! Your AI assistant is now live and answering questions from your documents.\n\nNeed help with a specific step?`,
  },
  {
    keywords: ['api', 'integration', 'embed', 'widget', 'javascript', 'code'],
    response: `You can embed the SupportAI widget on any website:\n\n**Option 1 — Direct URL**\nShare the link directly: \`/chat/your-company-slug\`\n\n**Option 2 — iFrame Embed**\n\`\`\`html\n<iframe src="/chat/your-company-slug"\n  width="400" height="600"\n  style="border:none; border-radius:12px;">\n</iframe>\n\`\`\`\n\n**Option 3 — REST API**\nSend \`POST /api/chat/{slug}/message\` with your message to integrate into any platform.\n\nWould you like the full API documentation?`,
  },
  {
    keywords: ['cancel', 'cancellation', 'refund', 'money back'],
    response: `You can cancel your subscription at any time:\n\n- Go to **Settings → Billing** in your dashboard\n- Click **Cancel Subscription**\n- Your access continues until the end of the current billing period\n\nWe offer a **14-day money-back guarantee** — no questions asked. If you're unhappy within the first 14 days, contact support for a full refund.\n\nIs there anything specific causing you to consider cancelling? We'd love to help resolve it.`,
  },
  {
    keywords: ['document', 'upload', 'pdf', 'faq', 'knowledge', 'file', 'data'],
    response: `SupportAI supports multiple document types:\n\n**Supported formats:**\n- PDF files (up to 10MB)\n- Plain text (.txt)\n- Markdown (.md)\n- FAQ format (Q: / A: pairs)\n\n**How it works:**\n1. Upload your file in the admin dashboard\n2. The AI splits it into semantic chunks\n3. Each chunk gets an embedding vector stored in the database\n4. When a user asks a question, the most relevant chunks are retrieved and sent to the AI\n\nFor best results, use clear headings and well-structured content. Would you like tips on optimizing your knowledge base?`,
  },
  {
    keywords: ['security', 'secure', 'privacy', 'data', 'gdpr', 'compliance'],
    response: `Security and privacy are our top priorities:\n\n- **Data Isolation** — Each company's data is fully isolated (multi-tenant)\n- **Encryption** — All data encrypted at rest and in transit (TLS 1.3)\n- **JWT Authentication** — Secure token-based admin access\n- **No Training** — Your data is never used to train AI models\n- **GDPR Ready** — Data deletion on request, audit logs available\n- **SOC 2 Type II** — Security audit available on Enterprise plan\n\nFor compliance documentation or a security review, please contact our enterprise team.`,
  },
  {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon'],
    response: `Hello! 👋 Great to hear from you!\n\nI'm the SupportAI assistant, here to help you with any questions about our platform. I can help you with:\n\n- **Pricing & Plans** — Find the right plan for your team\n- **Getting Started** — Setup and integration guides\n- **Features** — Everything SupportAI can do\n- **Technical Support** — API, embeds, and configuration\n\nWhat can I help you with today?`,
  },
  {
    keywords: ['contact', 'human', 'agent', 'person', 'talk', 'call', 'email'],
    response: `I'd be happy to connect you with our human team!\n\n**Support options:**\n- **Email:** support@supportai.io (response within 4 hours)\n- **Live Chat:** Available Mon–Fri, 9am–6pm EST\n- **Documentation:** docs.supportai.io\n\nFor Enterprise customers, you also get a dedicated Slack channel with your account manager.\n\nIs there something I wasn't able to help with? I'd like to improve my knowledge base!`,
  },
];

const DEFAULT_RESPONSE = `Thanks for your message! I'm the SupportAI demo assistant.\n\n🔑 **Demo Mode Active** — To enable real AI responses powered by your actual knowledge base:\n\n1. Get your OpenAI API key at [platform.openai.com](https://platform.openai.com)\n2. Edit \`backend/.env\` and set \`OPENAI_API_KEY=sk-...\`\n3. Restart the backend\n\nIn the meantime, try asking me about:\n- Pricing and plans\n- How to get started\n- Features and integrations\n- Security and privacy`;

/**
 * Generate a mock streaming response word-by-word.
 */
const generateDemoAnswer = (userMessage) => {
  const lower = userMessage.toLowerCase();

  const match = DEMO_RESPONSES.find(r =>
    r.keywords.some(kw => lower.includes(kw))
  );

  return match ? match.response : DEFAULT_RESPONSE;
};

/**
 * Simulate streaming by calling onChunk for each word.
 */
const generateDemoAnswerStream = async ({ userMessage, onChunk }) => {
  const answer = generateDemoAnswer(userMessage);

  // Stream word by word with realistic delay
  const words = answer.split(' ');
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? '' : ' ') + words[i];
    onChunk(chunk);
    // Variable delay: faster for short words, slight pause after punctuation
    const delay = words[i].endsWith('.') || words[i].endsWith('\n') ? 60 : 18;
    await new Promise(r => setTimeout(r, delay));
  }

  return {
    answer,
    sourcesUsed: [],
    tokenUsage: null,
    responseTimeMs: words.length * 18,
  };
};

module.exports = { generateDemoAnswer, generateDemoAnswerStream };
