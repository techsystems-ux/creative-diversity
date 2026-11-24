import type { Brand } from "./types";
import demoShampoo from "@/data/brands/demo-shampoo.json";

/**
 * Every brand the tool knows about. To add a brand:
 * 1. Put its creatives in /public/creatives/<slug>/
 * 2. Add /data/brands/<slug>.json in the shape of lib/types.ts → Brand
 * 3. Import it here and add it to the list.
 */
export const BRANDS: Brand[] = [demoShampoo as Brand];

export function getBrand(slug: string) {
  return BRANDS.find((b) => b.slug === slug);
}
