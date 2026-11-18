// Shared by the server query and the client graph. No imports from the database here.

export type GraphNode = {
  /** "u:<id>" person, "p:<id>" Pod, "h:<id>" hospital. */
  id: string;
  kind: "user" | "pod" | "hospital";
  label: string;
  href: string | null;
  // People
  blood?: string | null;
  city?: string | null;
  eligible?: boolean;
  onboarded?: boolean;
  alerts?: boolean;
  // Pods
  size?: number;
};

export type GraphLink = {
  source: string;
  target: string;
  /** owner and member join a person to a Pod; invite joins two people; catchment joins a hospital to donors in its city. */
  kind: "owner" | "member" | "invite" | "catchment";
};

export type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: {
    people: number;
    pods: number;
    hospitals: number;
    /** People in two or more Pods: the links that hold circles together. */
    bridges: number;
    /** People not in any Pod that has someone else in it. */
    isolated: number;
    /** Links made through a tracked invite. */
    invites: number;
  };
  truncated: boolean;
};
