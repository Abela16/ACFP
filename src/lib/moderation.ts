const BLOCKLIST = [
  "abuse",
  "hate",
  "idiot",
  "stupid",
  "kill",
  "racist",
  "violence",
];

export function isContentOffensive(input: string): boolean {
  const normalized = input.toLowerCase();
  return BLOCKLIST.some((word) => normalized.includes(word));
}
