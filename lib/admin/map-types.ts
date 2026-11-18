// Shared by the server query and the client map. No database imports here.

export type BloodTally = { total: number; eligible: number };

export type MapPerson = { id: string; name: string; blood: string | null; eligible: boolean };

export type MapPlace = {
  id: string;
  name: string;
  /** Town centre, never an individual's position. */
  lat: number;
  lng: number;
  donors: number;
  onboarded: number;
  /** Onboarded donors who can donate right now. */
  eligible: number;
  alerts: number;
  blood: Record<string, BloodTally>;
  /** A sample of the people here, for the side panel. */
  people: MapPerson[];
};

export type MapHospital = {
  id: string;
  name: string;
  city: string;
  /** null when the hospital's city is not a town we can place. */
  lat: number | null;
  lng: number | null;
};

export type MapData = {
  places: MapPlace[];
  hospitals: MapHospital[];
  /** Donors with no usable location. */
  unplaced: number;
  total: number;
  truncated: boolean;
};
