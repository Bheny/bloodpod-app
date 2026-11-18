import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

const ALLOWED = new Set([192, 512]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: raw } = await params;
  const size = Number(raw);
  if (!ALLOWED.has(size)) return new Response("Not found", { status: 404 });

  // Maskable icons need the artwork inside the central 80% safe zone.
  const maskable = request.nextUrl.searchParams.get("maskable") === "1";
  const art = maskable ? size * 0.6 : size * 0.78;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF8F6",
        }}
      >
        <svg viewBox="0 0 32 32" width={art} height={art}>
          <ellipse cx="12" cy="16" rx="10" ry="11" fill="#1C1C1E" />
          <ellipse cx="20" cy="16" rx="10" ry="11" fill="#DD0000" />
          <ellipse cx="16" cy="16" rx="4.5" ry="5.5" fill="#FAF8F6" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
