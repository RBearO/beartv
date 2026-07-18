/**
 * In-memory Redis stand-in for single-instance free-tier deploys.
 * Enabled when REDIS_URL is unset and ALLOW_INMEMORY_REDIS=true.
 * Not multi-instance safe — use real Redis for production scale.
 */

type ListItem = string;

export class MemoryRedis {
  private sets = new Map<string, Set<string>>();
  private strings = new Map<string, string>();
  private lists = new Map<string, ListItem[]>();

  async sadd(key: string, member: string) {
    const set = this.sets.get(key) ?? new Set<string>();
    const before = set.size;
    set.add(member);
    this.sets.set(key, set);
    return set.size > before ? 1 : 0;
  }

  async srem(key: string, member: string) {
    const set = this.sets.get(key);
    if (!set) return 0;
    return set.delete(member) ? 1 : 0;
  }

  async scard(key: string) {
    return this.sets.get(key)?.size ?? 0;
  }

  async set(key: string, value: string) {
    this.strings.set(key, value);
    return "OK";
  }

  async del(key: string) {
    const existed =
      this.strings.delete(key) || this.sets.delete(key) || this.lists.delete(key);
    return existed ? 1 : 0;
  }

  async rpush(key: string, value: string) {
    const list = this.lists.get(key) ?? [];
    list.push(value);
    this.lists.set(key, list);
    return list.length;
  }

  async lrange(key: string, start: number, stop: number) {
    const list = this.lists.get(key) ?? [];
    const end = stop < 0 ? list.length : stop + 1;
    return list.slice(start, end);
  }

  async lrem(key: string, count: number, value: string) {
    const list = this.lists.get(key) ?? [];
    if (count === 0) {
      const next = list.filter((item) => item !== value);
      const removed = list.length - next.length;
      this.lists.set(key, next);
      return removed;
    }
    let removed = 0;
    const next: ListItem[] = [];
    for (const item of list) {
      if (item === value && removed < Math.abs(count)) {
        removed += 1;
        continue;
      }
      next.push(item);
    }
    this.lists.set(key, next);
    return removed;
  }

  async llen(key: string) {
    return this.lists.get(key)?.length ?? 0;
  }
}
