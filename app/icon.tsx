import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#FFFFFF",
        }}
      >
        <svg viewBox="0 0 32 32" width="32" height="32">
          <ellipse cx="12" cy="16" rx="10" ry="11" fill="#1C1C1E" />
          <ellipse cx="20" cy="16" rx="10" ry="11" fill="#DD0000" />
          <ellipse cx="16" cy="16" rx="4.5" ry="5.5" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
