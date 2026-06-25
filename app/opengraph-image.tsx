import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1C1C1E",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(221,0,0,0.45) 0%, rgba(221,0,0,0) 70%)",
            top: -150,
            right: -150,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg viewBox="0 0 32 32" width="72" height="72">
            <ellipse cx="12" cy="16" rx="10" ry="11" fill="#FFFFFF" />
            <ellipse cx="20" cy="16" rx="10" ry="11" fill="#DD0000" />
            <ellipse cx="16" cy="16" rx="4.5" ry="5.5" fill="#1C1C1E" />
          </svg>
          <div style={{ fontSize: 72, fontWeight: 800, color: "#FFFFFF", display: "flex" }}>
            Blood<span style={{ color: "#DD0000" }}>Pod</span>
          </div>
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: "rgba(255,255,255,0.6)", display: "flex" }}>
          The people who will save your life — before you need them.
        </div>
      </div>
    ),
    { ...size },
  );
}
