/**
 * PDF Parser Worker — runs in an isolated child process.
 *
 * Why isolated? pdf-parse leaks ~hundreds of MB of heap per large/corrupt PDF
 * and never releases it. By running it in a forked child, all that memory is
 * reclaimed automatically when the child exits — the main server process
 * stays lean regardless of what the PDF does internally.
 *
 * Protocol (IPC via process.send / process.on('message')):
 *   Parent → child:  { bufferBase64: string, maxPages: number }
 *   Child  → parent: { text: string }  |  { error: string }
 */

process.on('message', async ({ bufferBase64, maxPages = 50 }) => {
  try {
    const buffer = Buffer.from(bufferBase64, 'base64');
    const pdf = require('pdf-parse');
    const data = await pdf(buffer, { max: maxPages });
    process.send({ text: data.text || '' });
  } catch (err) {
    // Try plain-text fallback for non-binary "PDFs"
    try {
      const buffer = Buffer.from(bufferBase64, 'base64');
      const asText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
      if (asText.length > 20) {
        process.send({ text: asText });
      } else {
        process.send({ error: err.message });
      }
    } catch {
      process.send({ error: err.message });
    }
  } finally {
    // Exit immediately — releases ALL pdf-parse memory back to the OS
    process.exit(0);
  }
});
