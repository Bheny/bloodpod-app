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

/** Shown only in development so the design can be previewed. Never shipped. */
export const SAMPLE_TESTIMONIALS: Testimonial[] = [
  { quote: "Sample text: this is where a real donor quote would go.", name: "Sample Donor", role: "Donor", place: "Accra" },
  { quote: "Sample text: a Pod leader describing how their group responded.", name: "Sample Leader", role: "Pod leader", place: "Kumasi" },
  { quote: "Sample text: a blood bank lead describing a drill.", name: "Sample Lead", role: "Blood bank lead" },
  { quote: "Sample text: a family member who used a family alert.", name: "Sample Member", role: "Family member", place: "Tema" },
  { quote: "Sample text: a student leader on getting their Pod started.", name: "Sample Student", role: "Student leader", place: "Legon" },
];
