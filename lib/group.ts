/** 회차 항목을 영역(categoryName)별로 순서를 유지하며 묶습니다. */
export function groupByCategory<T extends { categoryName: string }>(items: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(item.categoryName) ?? [];
    list.push(item);
    groups.set(item.categoryName, list);
  }
  return [...groups.entries()];
}
