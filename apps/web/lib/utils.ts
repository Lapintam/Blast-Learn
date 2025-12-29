export function cn(...values: Array<string | undefined | null | false | Record<string, boolean>>): string {
  return values
    .flatMap((value) => {
      if (!value) return [];
      if (typeof value === "string") return [value];
      return Object.entries(value)
        .filter(([, active]) => active)
        .map(([className]) => className);
    })
    .join(" ");
}
