export type MetalItem = {
  name: string;
  code: string;
  unit?: string;
  pending?: boolean;
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
  { name: "Iron", code: "FE" },
  { name: "Steel", code: "STEEL" },
  { name: "Lithium", code: "LI" },
  { name: "Cobalt", code: "CO" },
  { name: "Manganese", code: "MN" },
  { name: "Chromium", code: "CR" },
  { name: "Molybdenum", code: "MO" },
  { name: "Titanium", code: "TI" },
  { name: "Magnesium", code: "MG" },
  { name: "Tungsten", code: "W" },
  { name: "Vanadium", code: "V" },
  { name: "Silicon", code: "SI" },
  { name: "Graphite", code: "C" },
  { name: "Rare Earths (Index)", code: "RE" },
  { name: "Gallium", code: "GA" },
  { name: "Germanium", code: "GE" },
  { name: "Indium", code: "IN" },
  { name: "Antimony", code: "SB" },
  { name: "Bismuth", code: "BI" },
  { name: "Cadmium", code: "CD" }
];

export const METALS_CODES = METALS_LIST.map((item) => item.code);
