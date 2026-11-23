import QRCode from "qrcode";

/** Brand colours are fixed, not theme tokens: a QR code must stay dark on light in dark mode too. */
export const QR_COLORS = { ink: "#1C1C1E", red: "#DD0000", paper: "#FFFFFF" } as const;

/** Blank margin around the code, in modules. Scanners need at least 4. */
const QUIET = 4;

export type QrArt = {
  /** Side of the whole picture in modules, margin included. */
  size: number;
  /** One SVG path of round dots for the data modules. */
  dots: string;
  /** Top-left corner of each of the three eye squares, in picture coordinates. */
  eyes: { x: number; y: number }[];
  /** Clear patch for the logo, in picture coordinates. */
  logo: { x: number; y: number; side: number };
};

function dot(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
}

/**
 * Turns a link into drawing instructions. Error correction is the highest level, so the logo patch in the middle
 * (about 6% of the area) is far inside what a scanner can repair.
 */
export function buildQrArt(text: string): QrArt {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "H" });
  const n = modules.size;

  // Odd side so the logo sits on the exact middle module.
  let patch = Math.round(n * 0.24);
  if (patch % 2 === 0) patch += 1;
  const patchStart = (n - patch) / 2;

  const inEye = (r: number, c: number) => (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
  const inPatch = (r: number, c: number) =>
    r >= patchStart && r < patchStart + patch && c >= patchStart && c < patchStart + patch;

  let dots = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!modules.get(r, c) || inEye(r, c) || inPatch(r, c)) continue;
      dots += dot(QUIET + c + 0.5, QUIET + r + 0.5, 0.46);
    }
  }

  return {
    size: n + QUIET * 2,
    dots,
    eyes: [
      { x: QUIET, y: QUIET },
      { x: QUIET + n - 7, y: QUIET },
      { x: QUIET, y: QUIET + n - 7 },
    ],
    logo: { x: QUIET + patchStart, y: QUIET + patchStart, side: patch },
  };
}
