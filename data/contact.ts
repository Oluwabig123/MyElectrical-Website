const resolvedBusinessEmail =
  process.env.NEXT_PUBLIC_BUSINESS_EMAIL?.trim() || "hello@oduzzconcept.com.ng";

export const CONTACT = {
  phoneDisplay: "07032258039",
  phoneE164: "+2347032258039",
  whatsappNumber: "2347032258039",
  email: resolvedBusinessEmail,
  businessHours: "Mon-Sat, 8:00am to 8:00pm",
  whatsappResponseTime: "under 10 minutes",
} as const;

export const CONTACT_LINKS = {
  phone: `tel:${CONTACT.phoneE164}`,
  email: `mailto:${CONTACT.email}`,
  whatsapp: `https://wa.me/${CONTACT.whatsappNumber}`,
} as const;

export function buildWhatsAppUrl(encodedText = "") {
  return encodedText ? `${CONTACT_LINKS.whatsapp}?text=${encodedText}` : CONTACT_LINKS.whatsapp;
}
