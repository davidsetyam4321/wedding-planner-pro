/** Normalize an Indonesian phone number into a wa.me deep link, if it looks valid. */
export function waLink(contact: string): string | null {
  const digits = contact.replace(/[^0-9]/g, "");
  if (digits.length < 7) return null;
  const normalized = digits.replace(/^0/, "62");
  return `https://wa.me/${normalized}`;
}
