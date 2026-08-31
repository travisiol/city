import { ImageResponse } from "next/og";
import { siteConfig, world } from "@/lib/site-config";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#04070d",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", fontSize: 22, color: "#6d7d92", letterSpacing: 6 }}>
          {world.totalCities} LARGEST CITIES · ROBINHOOD CHAIN
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/*
            Broken by hand, on the same line as the page itself. Left to
            wrap, it orphans EARN on a line of its own and hangs AND off the
            end of the first — and an OG card is read at thumbnail size,
            where a bad break is the only thing anyone notices.
          */}
          <div style={{ display: "flex", fontSize: 88, color: "#ff7a18", letterSpacing: 2 }}>
            BUY YOUR CITY
          </div>
          <div style={{ display: "flex", fontSize: 88, color: "#e8eef7", letterSpacing: 2 }}>
            AND EARN
          </div>
          <div style={{ display: "flex", marginTop: 28, alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", width: 40, height: 40, background: "#ff7a18" }} />
            <div style={{ display: "flex", fontSize: 26, color: "#9fb0c6" }}>
              {siteConfig.name}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
