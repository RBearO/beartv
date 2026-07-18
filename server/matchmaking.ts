import type { QueueUser, MatchPreferences } from "../src/types/index";

export function scoreMatch(userA: QueueUser, userB: QueueUser, prefsA?: MatchPreferences): number {
  let score = 0;

  if (prefsA?.country && userB.country === prefsA.country) score += 30;
  if (prefsA?.gender && userB.gender === prefsA.gender) score += 20;

  const sharedInterests = userA.interests.filter((i) => userB.interests.includes(i));
  score += sharedInterests.length * 15;

  // Prefer users who've been waiting longer
  const waitTime = Math.min(Date.now() - userB.joinedAt, 60000);
  score += (waitTime / 60000) * 10;

  return score;
}

export function findBestMatch(
  user: QueueUser,
  candidates: QueueUser[],
  prefs?: MatchPreferences
): QueueUser | null {
  const eligible = candidates.filter((c) => c.userId !== user.userId);

  if (eligible.length === 0) return null;

  let bestMatch: QueueUser | null = null;
  let bestScore = -1;

  for (const candidate of eligible) {
    const score = scoreMatch(user, candidate, prefs);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}
