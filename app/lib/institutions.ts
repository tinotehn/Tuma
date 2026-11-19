export type Institution = { id: string; name: string; logo: string; color: string; kind: "bank" | "mobile"; prefix?: string };
export const BANKS: Institution[] = [
  { id: "cbz", name: "CBZ Bank", logo: "CBZ", color: "#0B3D26", kind: "bank" },
  { id: "steward", name: "Steward Bank", logo: "S", color: "#007A33", kind: "bank" },
  { id: "zb", name: "ZB Bank", logo: "ZB", color: "#E30613", kind: "bank" },
  { id: "fbc", name: "FBC Bank", logo: "FB", color: "#00205B", kind: "bank" },
  { id: "stanbic", name: "Stanbic Bank", logo: "SB", color: "#0033A0", kind: "bank" },
  { id: "ecobank", name: "Ecobank", logo: "EB", color: "#00843D", kind: "bank" },
  { id: "bancabc", name: "BancABC", logo: "ABC", color: "#F2A900", kind: "bank" },
  { id: "nmb", name: "NMB Bank", logo: "NMB", color: "#E60000", kind: "bank" },
  { id: "nedbank", name: "Nedbank Zimbabwe", logo: "NB", color: "#004D43", kind: "bank" },
];
export const MOBILE_MONEY: Institution[] = [
  { id: "ecocash", name: "EcoCash", logo: "E", color: "#E60000", kind: "mobile", prefix: "077/078" },
  { id: "onemoney", name: "OneMoney", logo: "O", color: "#FF6A00", kind: "mobile", prefix: "071" },
  { id: "telecash", name: "TeleCash", logo: "T", color: "#0072BC", kind: "mobile", prefix: "073" },
];
export const ALL_INSTITUTIONS = [...BANKS, ...MOBILE_MONEY];
export const findInstitution = (id: string) => ALL_INSTITUTIONS.find(i => i.id === id.toLowerCase());
