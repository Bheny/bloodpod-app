export type Testimonial = {
  quote: string;
  name: string;
  /** Role or relationship, e.g. "Pod leader" or "Blood bank lead". */
  role: string;
  place?: string;
};

/**
 * REAL quotes only, each from someone who agreed to be quoted.
 * While this list is empty, the landing page hides the testimonials section
 * in production. Add entries here after the Foresight drills.
 */
export const TESTIMONIALS: Testimonial[] = [];

/**
 * TEMPORARY placeholder wording so the design can be previewed. Not real quotes.
 * Shown in development only. Replace each one with a real, consented quote and move it
 * into TESTIMONIALS above; the landing page never shows this list in production.
 */
export const SAMPLE_TESTIMONIALS: Testimonial[] = [
  {
    quote: "I never thought about who I would call until I saw my Pod on one screen. Now I know exactly who is ready.",
    name: "Edmund",
    role: "Pod leader",
    place: "Accra",
  },
  {
    quote: "I like that I only get asked when I can actually give, and I can say no without any fuss.",
    name: "David",
    role: "Donor",
    place: "Kumasi",
  },
  {
    quote: "I brought my cousins and my office friends together. Seeing us all in one place made it feel real.",
    name: "Daniella",
    role: "Pod leader",
    place: "Tema",
  },
  {
    quote: "Our family group chat was always chaos. Now there is one place where everyone can answer yes or no.",
    name: "Berlinda",
    role: "Family member",
    place: "Takoradi",
  },
  {
    quote: "We started a Pod in our hall in one evening. Everyone just needed the link and two minutes.",
    name: "Alex",
    role: "Student leader",
    place: "Legon",
  },
  {
    quote: "It is simple. I put in my blood type and city, and now people nearby know I am ready to help.",
    name: "Chris",
    role: "Donor",
    place: "Cape Coast",
  },
  {
    quote: "Our church is close, and now we are prepared too. Setting it up before we need it gives us peace of mind.",
    name: "Godwin",
    role: "Church group leader",
    place: "Ho",
  },
  {
    quote: "I have started my family's Pod. I feel calmer knowing the people I trust are already lined up.",
    name: "Ella",
    role: "Mum",
    place: "Accra",
  },
];
