export type MetalItem = {
  name: string;
  code: string;
  unit?: string;
  pending?: boolean;
  stooqSymbol?: string;
};

export const METALS_LIST: MetalItem[] = [
  { name: "Gold", code: "XAU" },
  { name: "Silver", code: "XAG" },
  { name: "Platinum", code: "XPT" },
  { name: "Palladium", code: "XPD" },
  { name: "Copper", code: "XCU" },
  { name: "Aluminum", code: "ALU" },
  { name: "Nickel", code: "NI" },
  { name: "Zinc", code: "ZNC" },
  { name: "Tin", code: "TIN" },
  { name: "Lead", code: "LEAD" },
  { name: "Iron Ore", code: "FE" },
  { name: "Steel (Scrap)", code: "STEEL" },
  { name: "Cobalt", code: "CO" }
];

export const METALS_CODES = METALS_LIST.map((item) => item.code);
export const METALS_STOOQ = METALS_LIST.filter((item) => item.stooqSymbol);
