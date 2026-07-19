export type DetailType =
  | "gold-foil-underline"
  | "ink-flourish"
  | "ribbon-bookmark"
  | "pencil-margin-note"
  | "watercolor-splash"
  | "pressed-flower"
  | "calligraphic-border"
  | "none";

export type PageData = {
  id: string;
  theme: string;
  paperColor: string;
  inkColor: string;
  accentColor: string;
  hand: string;
  secondaryHand: string;
  title: string[];
  subtitle: string;
  note: string;
  date: string;
  signature: string;
  /** Display size of the title, in `cqi` — a share of the page's own width.
   *  Not `vw`: the book is sized off viewport *height*, so viewport-width type
   *  grows independently of the sheet it sits on and overruns it at wide
   *  aspect ratios. Against the page, the composition holds at any size. */
  titleSize: string;
  leading: number;
  detail: DetailType;
  isBlank?: boolean;
  /** Set the brand mark itself in place of the typeset title. The finale is the
   *  payoff of the whole sequence, so it should land on the real logo rather
   *  than a hand-lettered approximation of it. `title` goes unused when set. */
  logo?: boolean;
};

export const FLYLEAF: PageData = {
  id: "flyleaf",
  theme: "Flyleaf",
  paperColor: "#F8F5EE", // Cream heavy paper
  inkColor: "transparent",
  accentColor: "transparent",
  hand: "",
  secondaryHand: "",
  title: [],
  subtitle: "",
  note: "",
  date: "",
  signature: "",
  titleSize: "0",
  leading: 1,
  detail: "none",
  isBlank: true,
};

export const PAGES: PageData[] = [
  FLYLEAF,
  {
    id: "luxury-elegance",
    theme: "Luxury Elegance",
    paperColor: "#FDF9F1",
    inkColor: "#2C1A0E",
    accentColor: "#D4AF37",
    hand: "var(--hand-calligraphy)",
    secondaryHand: "var(--font-secondary)",
    title: ["Every masterpiece", "begins with an idea."],
    subtitle: "Design is the silent ambassador of your brand.",
    note: "→ refined by hand, 2026",
    date: "Atelier No. I",
    signature: "Roohae",
    titleSize: "16.6cqi",
    leading: 1.55,
    detail: "gold-foil-underline",
  },
  {
    id: "modern-brush",
    theme: "Modern Brush",
    paperColor: "#FDE8EC",
    inkColor: "#1A1A2E",
    accentColor: "#E8628A",
    hand: "var(--hand-brush)",
    secondaryHand: "var(--font-secondary)",
    title: ["Design", "without limits."],
    subtitle: "Bold strokes. Quiet confidence.",
    note: "* breathe, create, repeat",
    date: "Studio II",
    signature: "— R",
    titleSize: "24.6cqi",
    leading: 1.15,
    detail: "ink-flourish",
  },
  {
    id: "editorial-minimal",
    theme: "Editorial Minimal",
    paperColor: "#F7F4ED",
    inkColor: "#3B2C20",
    accentColor: "#9B7B5C",
    hand: "var(--hand-minimal)",
    secondaryHand: "var(--font-secondary)",
    title: ["Every detail", "tells a story."],
    subtitle: "Craft the moments that linger.",
    note: "drafted at the golden hour",
    date: "Chapter III",
    signature: "~ crafted with care",
    titleSize: "20.8cqi",
    leading: 1.5,
    detail: "ribbon-bookmark",
  },
  {
    id: "vintage-journal",
    theme: "Vintage Journal",
    paperColor: "#E8EFE9",
    inkColor: "#1B3A2A",
    accentColor: "#4A7C59",
    hand: "var(--hand-fountain)",
    secondaryHand: "var(--font-secondary)",
    title: ["Craft", "every moment", "beautifully."],
    subtitle: "Time spent creating is never wasted.",
    note: "penned in the garden",
    date: "Vol. IV",
    signature: "✦ yours sincerely",
    titleSize: "16.6cqi",
    leading: 1.75,
    detail: "pencil-margin-note",
  },
  {
    id: "creative-sketchbook",
    theme: "Creative Sketchbook",
    paperColor: "#DDF0F7",
    inkColor: "#0D1B4B",
    accentColor: "#3B82C4",
    hand: "var(--hand-script)",
    secondaryHand: "var(--font-secondary)",
    title: ["Imagine beyond", "the ordinary."],
    subtitle: "Where curiosity meets craft.",
    note: "sketched from imagination",
    date: "Page V",
    signature: "—a dreamer",
    titleSize: "19.6cqi",
    leading: 1.45,
    detail: "watercolor-splash",
  },
  {
    id: "mixed-typography",
    theme: "Mixed Typography",
    paperColor: "#EDE9F6",
    inkColor: "#0B0B0B",
    accentColor: "#7C3AED",
    hand: "var(--hand-marker)",
    secondaryHand: "var(--font-secondary)",
    title: ["Create.", "Inspire.", "Remember."],
    subtitle: "Leave a mark that outlasts the moment.",
    note: "written in purple ink",
    date: "VI ◆",
    signature: "forever yours",
    titleSize: "17.9cqi",
    leading: 1.55,
    detail: "pressed-flower",
  },
];

export const FINALE: PageData = {
  id: "finale",
  theme: "Finale",
  paperColor: "#FDF8EB",
  inkColor: "#1C1408",
  accentColor: "#D4AF37",
  hand: "var(--hand-finale)",
  secondaryHand: "var(--font-secondary)",
  // The logo stands in for the title here — see `logo` below.
  title: [],
  subtitle: "Where beautiful moments begin.",
  note: "est. 2026 · with love",
  date: "∞",
  signature: "Roohae Cards",
  titleSize: "0",
  leading: 1.4,
  detail: "calligraphic-border",
  logo: true,
};

/** -----------------------------------
 * SPREADS
 *
 * A spread is what you actually read: two facing pages. It is never one leaf.
 * The verso (left) is the *back* of the leaf that just turned; the recto
 * (right) is the *front* of the leaf still to turn. So spread `i` is painted
 * across two different sheets, and turning one leaf swaps both halves at once —
 * which is exactly why the composition tears apart mid-turn and reassembles,
 * the way paper does.
 * ----------------------------------- */
export const SPREADS: PageData[] = [...PAGES, FINALE];
