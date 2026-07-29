export interface Contact {
  first: string;
  last: string;
  org: string;
  title: string;
  mobile: string;
  work: string;
  email: string;
  url: string;
  address: string;
  note: string;
}

export type Format = "vcard" | "mecard";

export type Ecc = "L" | "M" | "Q" | "H";

export const emptyContact: Contact = {
  first: "",
  last: "",
  org: "",
  title: "",
  mobile: "",
  work: "",
  email: "",
  url: "",
  address: "",
  note: "",
};

export const sampleContact: Contact = {
  ...emptyContact,
  first: "Amara",
  last: "Okoye",
  org: "InversePay",
  title: "Partnerships Lead",
  mobile: "+250 788 123 456",
  email: "amara@inversepay.com",
  url: "inversepay.com",
};

export function fullName(c: Contact): string {
  return `${c.first} ${c.last}`.trim();
}

export function roleLine(c: Contact): string {
  return [c.title, c.org].filter(Boolean).join(" · ");
}
