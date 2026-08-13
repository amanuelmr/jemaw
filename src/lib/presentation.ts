export const CATEGORY_META: Record<string, { emoji: string; tint: string; label: string }> = {
  breakfast: { emoji: "☕", tint: "bg-amber-100", label: "Breakfast" },
  lunch: { emoji: "🥪", tint: "bg-orange-100", label: "Lunch" },
  dinner: { emoji: "🍽️", tint: "bg-rose-100", label: "Dinner" },
  groceries: { emoji: "🛒", tint: "bg-emerald-100", label: "Groceries" },
  transportation: { emoji: "🚕", tint: "bg-sky-100", label: "Transport" },
  utilities: { emoji: "💡", tint: "bg-violet-100", label: "Utilities" },
  rent: { emoji: "🏠", tint: "bg-indigo-100", label: "Rent" },
  entertainment: { emoji: "🎟️", tint: "bg-pink-100", label: "Fun" },
  vacation: { emoji: "🧳", tint: "bg-cyan-100", label: "Travel" },
  shopping: { emoji: "🛍️", tint: "bg-fuchsia-100", label: "Shopping" },
  healthcare: { emoji: "🩺", tint: "bg-red-100", label: "Health" },
  other: { emoji: "🧾", tint: "bg-stone-200", label: "Other" },
};

export function getCategoryMeta(category: string) {
  return CATEGORY_META[category] ?? CATEGORY_META.other;
}

const GROUP_EMOJI_RULES: Array<[string[], string]> = [
  [["trip", "travel", "vacation", "road", "tour"], "🚌"],
  [["home", "house", "apartment", "room", "rent"], "🏠"],
  [["food", "dinner", "lunch", "restaurant", "crew"], "🍽️"],
  [["office", "work", "team"], "💼"],
  [["party", "birthday", "event"], "🎉"],
  [["family"], "🌿"],
  [["wedding"], "💍"],
];

export function getGroupEmoji(name: string) {
  const normalized = name.toLowerCase();
  return GROUP_EMOJI_RULES.find(([terms]) => terms.some((term) => normalized.includes(term)))?.[1] ?? "✦";
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function dayLabel(date: Date | string) {
  const value = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const key = value.toDateString();
  if (key === today.toDateString()) return "Today";
  if (key === yesterday.toDateString()) return "Yesterday";
  return value.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
