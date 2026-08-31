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
          <div style={{ display: "flex", fontSize: 92, color: "#e8eef7", letterSpacing: 2 }}>
            BUY INTO A CITY
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
