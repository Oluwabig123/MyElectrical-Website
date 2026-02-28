export const CONTACT = {
  phoneDisplay: "07032258039",
  phoneE164: "+2347032258039",
  whatsappNumber: "2347032258039",
  email: "tobiloba428@gmail.com",
  businessHours: "Mon-Sat, 8:00am to 8:00pm",
  whatsappResponseTime: "under 10 minutes",
};

export const CONTACT_LINKS = {
  phone: `tel:${CONTACT.phoneE164}`,
  email: `mailto:${CONTACT.email}`,
  whatsapp: `https://wa.me/${CONTACT.whatsappNumber}`,
};

export function buildWhatsAppUrl(encodedText = "") {
  return encodedText
    ? `${CONTACT_LINKS.whatsapp}?text=${encodedText}`
    : CONTACT_LINKS.whatsapp;
}
