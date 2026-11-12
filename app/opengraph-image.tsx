import { ImageResponse } from "next/og";
export const alt =
  "BuildMyX — reporting automation, practical data learning and developer sourcing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#f4f1ea",
        color: "#18211c",
        padding: "70px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 23, color: "#28553d" }}>
        AI DEVELOPMENT. LEARNING. DEVELOPER SOURCING.
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 144,
          letterSpacing: "-8px",
          marginTop: 55,
        }}
      >
        BuildMy<span style={{ color: "#28553d", fontStyle: "italic" }}>X</span>
        <span style={{ color: "#a7412c" }}>.</span>
      </div>
      <div style={{ display: "flex", fontSize: 37, marginTop: 25 }}>
        Build something useful.
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "auto",
          fontSize: 23,
          color: "#60665e",
        }}
      >
        Reporting automation · Practical data learning · Developer sourcing
      </div>
    </div>,
    { ...size },
  );
}
