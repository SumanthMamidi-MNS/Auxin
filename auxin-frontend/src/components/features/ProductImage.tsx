"use client";
/**
 * components/features/ProductImage.tsx
 * Single source of truth for product imagery.
 *
 * - Every mapped Unsplash photo below was checked by eye against its product.
 * - Products without a verified photo get a clean tinted placeholder with the
 *   product's emoji, never a "close enough" photo.
 * - Known-wrong URLs that arrive from data (for example a strawberry photo
 *   stored against "Coriander") are ignored and resolved by name instead.
 * - If a remote image fails to load, the placeholder is shown.
 */

import { useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";

type Tone = "leaf" | "fruit" | "citrus" | "root" | "grain" | "dairy" | "spice" | "neutral";

interface ImageRule {
  key: string;
  match: RegExp;
  /** Verified Unsplash photo id (without the "photo-" prefix), or null for placeholder. */
  photo: string | null;
  emoji?: string;
  tone: Tone;
}

/* Order matters: more specific patterns must come before generic ones. */
const RULES: ImageRule[] = [
  // ── Fruits ─────────────────────────────────────────────────────────────
  { key: "raw-mango",     match: /raw mango/,                       photo: null,                            emoji: "🥭", tone: "leaf" },
  { key: "mango",         match: /mango/,                           photo: "1601493700631-2b16ec4b4716",    emoji: "🥭", tone: "fruit" },
  { key: "raw-banana",    match: /raw banana|plantain/,             photo: null,                            emoji: "🍌", tone: "leaf" },
  { key: "banana",        match: /banana/,                          photo: "1603833665858-e61d17a86224",    emoji: "🍌", tone: "fruit" },
  { key: "custard-apple", match: /custard apple|sitaphal/,          photo: "1680008703432-2b7c0a6a18b5",    emoji: "🍏", tone: "leaf" },
  { key: "pineapple",     match: /pineapple/,                       photo: "1550258987-190a2d41a8ba",       emoji: "🍍", tone: "fruit" },
  { key: "apple",         match: /\bapples?\b/,                     photo: "1560806887-1e4cd0b6cbd6",       emoji: "🍎", tone: "fruit" },
  { key: "green-papaya",  match: /(green|raw) papaya/,              photo: null,                            emoji: "🍈", tone: "leaf" },
  { key: "papaya",        match: /papaya/,                          photo: "1517282009859-f000ec3b26fe",    emoji: "🍈", tone: "fruit" },
  { key: "jackfruit",     match: /jackfruit/,                       photo: "1620685581318-91ce6f1b76ca",    emoji: "🍈", tone: "leaf" },
  { key: "watermelon",    match: /watermelon/,                      photo: "1587049352846-4a222e784d38",    emoji: "🍉", tone: "fruit" },
  { key: "coconut-oil",   match: /coconut oil/,                     photo: null,                            emoji: "🥥", tone: "neutral" },
  { key: "copra",         match: /dry coconut|copra/,               photo: null,                            emoji: "🥥", tone: "neutral" },
  { key: "coconut",       match: /coconut/,                         photo: "1560769680-ba2f3767c785",       emoji: "🥥", tone: "neutral" },
  { key: "guava",         match: /guava/,                           photo: "1693399991519-bef70bed19a2",    emoji: "🍐", tone: "leaf" },
  { key: "sweet-lime",    match: /sweet lime|mousambi|mosambi/,     photo: null,                            emoji: "🍊", tone: "citrus" },
  { key: "orange",        match: /orange/,                          photo: "1587735243615-c03f25aaff15",    emoji: "🍊", tone: "citrus" },
  { key: "lemongrass",    match: /lemon ?grass/,                    photo: null,                            emoji: "🌿", tone: "leaf" },
  { key: "lemon",         match: /lemon/,                           photo: "1582287104445-6754664dbdb2",    emoji: "🍋", tone: "citrus" },
  { key: "lime",          match: /\blimes?\b/,                      photo: "1620101680155-b251043b700b",    emoji: "🍋", tone: "citrus" },
  { key: "pomelo",        match: /pomelo/,                          photo: null,                            emoji: "🍊", tone: "citrus" },
  { key: "pomegranate",   match: /pomegranate/,                     photo: "1615485925600-97237c4fc1ec",    emoji: "🍎", tone: "fruit" },
  { key: "black-grapes",  match: /black grape|grapes? \(black\)/,   photo: "1596363505729-4190a9506133",    emoji: "🍇", tone: "fruit" },
  { key: "grapes",        match: /grape/,                           photo: "1637715924886-cbe4485f90b9",    emoji: "🍇", tone: "leaf" },
  { key: "strawberry",    match: /strawberr/,                       photo: "1601004890684-d8cbf643f5f2",    emoji: "🍓", tone: "fruit" },
  { key: "fig",           match: /\bfigs?\b|anjeer/,                photo: "1601379760883-1bb497c558f0",    tone: "fruit" },
  { key: "amla",          match: /amla|gooseberr/,                  photo: "1676043966983-f5bd22435e64",    tone: "leaf" },
  { key: "starfruit",     match: /star ?fruit|carambola/,           photo: "1619748062504-44477fb7023f",    emoji: "⭐", tone: "citrus" },
  { key: "passion-fruit", match: /passion ?fruit/,                  photo: "1604495772376-9657f0035eb5",    tone: "fruit" },
  { key: "dragon-fruit",  match: /dragon ?fruit/,                   photo: "1635843110565-cb35d1c03d86",    emoji: "🐉", tone: "fruit" },

  // ── Leafy greens & herbs ──────────────────────────────────────────────
  { key: "spinach",       match: /spinach|palak/,                   photo: "1576045057995-568f588f82fb",    emoji: "🥬", tone: "leaf" },
  { key: "fenugreek",     match: /fenugreek|methi/,                 photo: null,                            emoji: "🌿", tone: "leaf" },
  { key: "coriander-seed",match: /coriander seed/,                  photo: null,                            emoji: "🫙", tone: "spice" },
  { key: "coriander",     match: /coriander|cilantro|dhaniya/,      photo: "1588879460618-9249e7d947d1",    emoji: "🌿", tone: "leaf" },
  { key: "mint",          match: /\bmint\b|pudina/,                 photo: "1618130070080-91f4d55a2383",    emoji: "🌿", tone: "leaf" },
  { key: "curry-leaves",  match: /curry lea/,                       photo: null,                            emoji: "🌿", tone: "leaf" },
  { key: "basil",         match: /basil|tulsi/,                     photo: null,                            emoji: "🌿", tone: "leaf" },
  { key: "drumstick-leaf",match: /drumstick lea|moringa lea/,       photo: null,                            emoji: "🌿", tone: "leaf" },
  { key: "drumstick",     match: /drumstick|moringa/,               photo: null,                            emoji: "🥢", tone: "leaf" },

  // ── Vegetables ────────────────────────────────────────────────────────
  { key: "tomato",        match: /tomato/,                          photo: "1546094096-0df4bcaaa337",       emoji: "🍅", tone: "fruit" },
  { key: "onion",         match: /onion/,                           photo: "1605197378298-02bf0af1c896",    emoji: "🧅", tone: "root" },
  { key: "sweet-potato",  match: /sweet potato/,                    photo: null,                            emoji: "🍠", tone: "root" },
  { key: "potato",        match: /potato/,                          photo: "1518977676601-b53f82aba655",    emoji: "🥔", tone: "root" },
  { key: "carrot",        match: /carrot/,                          photo: "1598170845058-32b9d6a5da37",    emoji: "🥕", tone: "root" },
  { key: "beetroot",      match: /beet/,                            photo: "1744028982670-67ca067bedfa",    tone: "root" },
  { key: "radish",        match: /radish|mooli/,                    photo: "1585369496178-144fd937f249",    emoji: "🥕", tone: "root" },
  { key: "ginger",        match: /ginger/,                          photo: "1630623093145-f606591c2546",    emoji: "🫚", tone: "root" },
  { key: "garlic",        match: /garlic/,                          photo: "1636210589096-a53d5dacd702",    emoji: "🧄", tone: "root" },
  { key: "turmeric",      match: /turmeric|haldi/,                  photo: "1666818398897-381dd5eb9139",    tone: "spice" },
  { key: "bitter-gourd",  match: /bitter gourd|karela/,             photo: "1739903760973-4731a8e79a03",    emoji: "🥒", tone: "leaf" },
  { key: "gourd",         match: /gourd/,                           photo: null,                            emoji: "🥒", tone: "leaf" },
  { key: "pumpkin",       match: /pumpkin/,                         photo: "1692680919402-95fc56f99225",    emoji: "🎃", tone: "fruit" },
  { key: "green-beans",   match: /green beans|french beans/,        photo: "1574963835594-61eede2070dc",    emoji: "🫛", tone: "leaf" },
  { key: "green-peas",    match: /\bpeas\b|matar/,                  photo: "1642864106922-f79b4aea18b4",    emoji: "🫛", tone: "leaf" },
  { key: "okra",          match: /okra|lady ?finger|bhindi/,        photo: "1558408525-1092038389ae",       emoji: "🥒", tone: "leaf" },
  { key: "red-capsicum",  match: /capsicum \(red\)|red capsicum|red bell pepper/, photo: "1525607551316-4a8e16d1f9ba", emoji: "🫑", tone: "fruit" },
  { key: "capsicum",      match: /capsicum|bell pepper/,            photo: "1622376242797-538aa64a9d38",    emoji: "🫑", tone: "leaf" },
  { key: "brinjal",       match: /brinjal|eggplant|baingan/,        photo: "1615484477201-9f4953340fab",    emoji: "🍆", tone: "fruit" },
  { key: "cauliflower",   match: /cauliflower/,                     photo: "1613743983303-b3e89f8a2b80",    emoji: "🥦", tone: "neutral" },
  { key: "cabbage",       match: /cabbage/,                         photo: "1611105637889-3afd7295bdbf",    emoji: "🥬", tone: "leaf" },
  { key: "broccoli",      match: /broccoli/,                        photo: "1615485290382-441e4d049cb5",    emoji: "🥦", tone: "leaf" },
  { key: "corn",          match: /corn|maize|bhutta/,               photo: "1634467524884-897d0af5e104",    emoji: "🌽", tone: "grain" },
  { key: "cucumber",      match: /cucumber|kheera/,                 photo: "1449300079323-02e209d9d3a6",    emoji: "🥒", tone: "leaf" },
  { key: "yam",           match: /yam|suran|colocasia|arbi/,        photo: null,                            emoji: "🍠", tone: "root" },

  // ── Grains, pulses & seeds ────────────────────────────────────────────
  { key: "poha",          match: /beaten rice|poha/,                photo: null,                            emoji: "🍚", tone: "grain" },
  { key: "coloured-rice", match: /rice.*(brown|red)|(brown|red) rice/, photo: null,                         emoji: "🍚", tone: "grain" },
  { key: "rice",          match: /rice/,                            photo: "1723475158232-819e29803f4d",    emoji: "🍚", tone: "grain" },
  { key: "flour",         match: /flour|atta/,                      photo: "1627735483792-233bf632619b",    emoji: "🌾", tone: "grain" },
  { key: "wheat",         match: /wheat/,                           photo: "1574323347407-f5e1ad6d020b",    emoji: "🌾", tone: "grain" },
  { key: "millet",        match: /millet|ragi|bajra|jowar|sorghum/, photo: null,                            emoji: "🌾", tone: "grain" },
  { key: "masoor",        match: /masoor/,                          photo: "1614373532201-c40b993f0013",    emoji: "🫘", tone: "spice" },
  { key: "dal",           match: /\bdal\b|lentil|gram/,             photo: null,                            emoji: "🫘", tone: "grain" },
  { key: "chickpeas",     match: /chickpea|kabuli/,                 photo: "1515543904379-3d757afe72e4",    emoji: "🫘", tone: "grain" },
  { key: "groundnut-oil", match: /groundnut oil|peanut oil/,        photo: null,                            emoji: "🫗", tone: "grain" },
  { key: "peanuts",       match: /peanut|groundnut/,                photo: "1549978113-29eb25c8177f",       emoji: "🥜", tone: "grain" },
  { key: "flax",          match: /flax|alsi/,                       photo: "1642497393790-c5751b818e1b",    emoji: "🫙", tone: "grain" },
  { key: "sunflower",     match: /sunflower seed/,                  photo: "1635843111961-06c71c3ed8cf",    emoji: "🌻", tone: "grain" },
  { key: "sesame-oil",    match: /sesame oil|gingelly/,             photo: null,                            emoji: "🫗", tone: "grain" },
  { key: "sesame",        match: /sesame|gingelly/,   photo: null,                            emoji: "🫙", tone: "grain" },

  // ── Dairy & natural products ──────────────────────────────────────────
  { key: "buttermilk",    match: /buttermilk|chaas/,                photo: null,                            emoji: "🥛", tone: "dairy" },
  { key: "milk",          match: /milk/,                            photo: "1634141510639-d691d86f47be",    emoji: "🥛", tone: "dairy" },
  { key: "curd",          match: /curd|dahi|yog(h)?urt/,            photo: null,                            emoji: "🥣", tone: "dairy" },
  { key: "ghee",          match: /ghee/,                            photo: null,                            emoji: "🧈", tone: "dairy" },
  { key: "paneer",        match: /paneer/,                          photo: null,                            emoji: "🧀", tone: "dairy" },
  { key: "eggs",          match: /\beggs?\b/,                       photo: "1506976785307-8732e854ad03",    emoji: "🥚", tone: "dairy" },
  { key: "honey",         match: /honey/,                           photo: "1587049352851-8d4e89133924",    emoji: "🍯", tone: "spice" },
  { key: "jaggery",       match: /jaggery|\bgur\b/,                 photo: null,                            tone: "spice" },
  { key: "sugarcane",     match: /sugarcane/,                       photo: null,                            emoji: "🎋", tone: "leaf" },
  { key: "tamarind",      match: /tamarind|imli/,                   photo: null,                            tone: "spice" },
  { key: "oil",           match: /\boil\b/,                         photo: null,                            emoji: "🫗", tone: "grain" },

  // ── Spices ────────────────────────────────────────────────────────────
  { key: "black-pepper",  match: /black pepper|peppercorn/,         photo: "1649951806971-ad0e00408773",    tone: "spice" },
  { key: "red-chilli",    match: /(dry|dried|red) chill?i/,         photo: "1602237514002-c2d8ae2da393",    emoji: "🌶️", tone: "fruit" },
  { key: "chilli",        match: /chill?i/,                         photo: null,                            emoji: "🌶️", tone: "leaf" },
  { key: "cardamom",      match: /cardamom|elaichi/,                photo: "1701166627787-12d9fdd437cc",    emoji: "🌿", tone: "spice" },
  { key: "mustard",       match: /mustard/,                         photo: "1701188543419-f2e932565056",    emoji: "🫙", tone: "spice" },
  { key: "cinnamon",      match: /cinnamon|dalchini/,               photo: "1553499944-e4297a0af1bd",       emoji: "🪵", tone: "spice" },
  { key: "cloves",        match: /\bcloves?\b|laung/,               photo: "1701191310584-3f319e0e6c59",    emoji: "🫙", tone: "spice" },
  { key: "star-anise",    match: /star anise/,                      photo: "1642255485146-bc28a517dcfb",    emoji: "⭐", tone: "spice" },
  { key: "cumin",         match: /cumin|jeera/,                     photo: null,                            emoji: "🫙", tone: "spice" },
  { key: "fennel",        match: /fennel|saunf/,                    photo: null,                            emoji: "🌿", tone: "spice" },
];

/**
 * Photos whose subject is known. If a product's data points at one of these
 * but the product resolves to a different subject, the URL is ignored.
 * "none" = never a valid product photo (portrait, generic food, broken link).
 */
const KNOWN_PHOTO_SUBJECTS: Record<string, string> = {
  "1601004890684-d8cbf643f5f2": "strawberry",
  "1587735243615-c03f25aaff15": "orange",
  "1615485290382-441e4d049cb5": "broccoli",
  "1568584711075-3d021a7c3ca3": "cauliflower",
  "1548690312-e3b507d8c110": "none",
  "1536304993881-ff86e6d42a46": "none",
  "1490645935967-10de6ba17061": "none",
  "1582476561868-cd4d22d7cd1e": "none",
};

const CATEGORY_EMOJI: Record<string, string> = {
  vegetables: "🥦",
  "leafy-greens": "🥬",
  "root-vegetables": "🥕",
  gourds: "🥒",
  "beans-pods": "🫛",
  fruits: "🍎",
  "tropical-fruits": "🥭",
  "citrus-fruits": "🍊",
  "stone-fruits": "🍑",
  "grains-pulses": "🌾",
  "rice-varieties": "🍚",
  "wheat-flour-cat": "🌾",
  millets: "🌾",
  "lentils-dals": "🫘",
  "dairy-eggs": "🥛",
  "milk-products": "🥛",
  "herbs-spices": "🌿",
  "fresh-herbs": "🌿",
  "dry-spices": "🌰",
  "natural-products": "🍯",
};

const CATEGORY_TONE: Record<string, Tone> = {
  vegetables: "leaf",
  "leafy-greens": "leaf",
  "root-vegetables": "root",
  gourds: "leaf",
  "beans-pods": "leaf",
  fruits: "fruit",
  "tropical-fruits": "fruit",
  "citrus-fruits": "citrus",
  "stone-fruits": "fruit",
  "grains-pulses": "grain",
  "rice-varieties": "grain",
  "wheat-flour-cat": "grain",
  millets: "grain",
  "lentils-dals": "grain",
  "dairy-eggs": "dairy",
  "milk-products": "dairy",
  "herbs-spices": "spice",
  "fresh-herbs": "leaf",
  "dry-spices": "spice",
  "natural-products": "spice",
};

/* Soft, low-contrast backgrounds so the emoji reads clearly in both sizes. */
const TONE_BG: Record<Tone, string> = {
  leaf:    "radial-gradient(120% 90% at 30% 20%, #F0FBF3 0%, #DCF3E3 55%, #CBEBD5 100%)",
  fruit:   "radial-gradient(120% 90% at 30% 20%, #FFF6EE 0%, #FDE6D3 55%, #F9D6BC 100%)",
  citrus:  "radial-gradient(120% 90% at 30% 20%, #FFFBEA 0%, #FDF1C7 55%, #F8E5A6 100%)",
  root:    "radial-gradient(120% 90% at 30% 20%, #FBF6F0 0%, #F1E6D8 55%, #E7D6C2 100%)",
  grain:   "radial-gradient(120% 90% at 30% 20%, #FDFAF1 0%, #F5ECD3 55%, #ECDDB8 100%)",
  dairy:   "radial-gradient(120% 90% at 30% 20%, #F8FBFF 0%, #EAF2FB 55%, #DCE8F6 100%)",
  spice:   "radial-gradient(120% 90% at 30% 20%, #FDF6EE 0%, #F6E3CF 55%, #EED1B3 100%)",
  neutral: "radial-gradient(120% 90% at 30% 20%, #FBFAF6 0%, #F2F0E6 55%, #E8E5D8 100%)",
};

const unsplash = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=75&fit=crop&auto=format`;

function findRule(name: string): ImageRule | undefined {
  const n = (name || "").toLowerCase();
  return RULES.find((r) => r.match.test(n));
}

function photoIdOf(url: string): string | null {
  const m = url.match(/images\.unsplash\.com\/photo-([0-9a-z-]+)/i);
  return m ? m[1] : null;
}

export interface ResolvedProductImage {
  /** Remote photo URL, or null when the placeholder should be shown. */
  src: string | null;
  emoji: string;
  background: string;
}

export function resolveProductImage(
  name: string,
  url?: string | null,
  opts: { categorySlug?: string | null; categoryIcon?: string | null; width?: number } = {}
): ResolvedProductImage {
  const rule = findRule(name);
  const width = opts.width ?? 600;
  const tone: Tone = rule?.tone ?? (opts.categorySlug ? CATEGORY_TONE[opts.categorySlug] : undefined) ?? "neutral";
  const emoji =
    rule?.emoji ??
    opts.categoryIcon ??
    (opts.categorySlug ? CATEGORY_EMOJI[opts.categorySlug] : undefined) ??
    "🌱";
  const background = TONE_BG[tone];

  // 1. Trust a provided URL unless we know it shows something else.
  const provided = url?.trim();
  if (provided) {
    const id = photoIdOf(provided);
    const subject = id ? KNOWN_PHOTO_SUBJECTS[id] : undefined;
    if (!subject || (rule && subject === rule.key)) {
      return { src: provided, emoji, background };
    }
  }

  // 2. Verified name-based photo, else placeholder.
  return { src: rule?.photo ? unsplash(rule.photo, width) : null, emoji, background };
}

/** Back-compat helper: returns a verified photo URL, or null for "use placeholder". */
export function getProductImage(name: string, url?: string | null): string | null {
  return resolveProductImage(name, url).src;
}

/* ── Component ─────────────────────────────────────────────────────────── */

interface ProductImageProps {
  name: string;
  imageUrl?: string | null;
  categorySlug?: string | null;
  categoryIcon?: string | null;
  /** next/image sizes hint */
  sizes?: string;
  /** Requested photo width from Unsplash */
  width?: number;
  className?: string;
  imgClassName?: string;
  /** Emoji scale relative to the box */
  emojiClassName?: string;
  preload?: boolean;
}

/**
 * Fills its (relative, sized) parent. Renders a verified photo with
 * object-cover, or a tinted emoji placeholder.
 */
export function ProductImage({
  name,
  imageUrl,
  categorySlug,
  categoryIcon,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px",
  width,
  className,
  imgClassName,
  emojiClassName = "text-[clamp(2rem,42cqw,5rem)]",
  preload = false,
}: ProductImageProps) {
  const resolved = resolveProductImage(name, imageUrl, { categorySlug, categoryIcon, width });
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showPhoto = !!resolved.src && failedSrc !== resolved.src;

  return (
    <div
      className={clsx("absolute inset-0 overflow-hidden", className)}
      style={{ background: resolved.background, containerType: "size" }}
    >
      {showPhoto ? (
        <Image
          src={resolved.src!}
          alt={name}
          fill
          sizes={sizes}
          preload={preload}
          className={clsx("object-cover", imgClassName)}
          onError={() => setFailedSrc(resolved.src)}
        />
      ) : (
        <div role="img" aria-label={name} className="absolute inset-0 flex items-center justify-center select-none">
          <span
            aria-hidden="true"
            className={clsx("leading-none drop-shadow-[0_6px_10px_rgba(15,23,42,0.12)]", emojiClassName)}
          >
            {resolved.emoji}
          </span>
        </div>
      )}
    </div>
  );
}
