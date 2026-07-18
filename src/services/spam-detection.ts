const SPAM_WINDOW = 10000; // 10 seconds
const SPAM_THRESHOLD = 5; // max messages in window
const DUPLICATE_THRESHOLD = 3;

interface MessageRecord {
  messages: { content: string; timestamp: number }[];
}

const userMessages = new Map<string, MessageRecord>();

export function detectSpam(userId: string, content: string): boolean {
  const now = Date.now();
  let record = userMessages.get(userId);

  if (!record) {
    record = { messages: [] };
    userMessages.set(userId, record);
  }

  // Clean old messages
  record.messages = record.messages.filter(
    (m) => now - m.timestamp < SPAM_WINDOW
  );

  // Check rate
  if (record.messages.length >= SPAM_THRESHOLD) {
    return true;
  }

  // Check duplicates
  const duplicateCount = record.messages.filter(
    (m) => m.content === content
  ).length;
  if (duplicateCount >= DUPLICATE_THRESHOLD) {
    return true;
  }

  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (content.length > 10 && capsRatio > 0.7) {
    return true;
  }

  record.messages.push({ content, timestamp: now });
  return false;
}

export function clearSpamRecord(userId: string): void {
  userMessages.delete(userId);
}
