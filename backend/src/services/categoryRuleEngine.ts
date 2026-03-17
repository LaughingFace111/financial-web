export type Rule = { categoryId: number; pattern: string; isRegex: boolean; priority: number };
export type StagingTx = { description: string; amount: string; happenedAt: string };

export class CategoryRuleEngine {
  static predictCategoryId(row: StagingTx, rules: Rule[]): number | null {
    const text = row.description.toLowerCase();
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);

    for (const rule of sorted) {
      if (rule.isRegex) {
        if (new RegExp(rule.pattern, 'i').test(text)) return rule.categoryId;
      } else if (text.includes(rule.pattern.toLowerCase())) {
        return rule.categoryId;
      }
    }
    return null;
  }
}
