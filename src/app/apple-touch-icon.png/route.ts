import { ImageResponse } from "next/og";
import { createElement } from "react";

export const runtime = "edge";

export function GET() {
  const size = 180;

  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          alignItems: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #67e8f9 100%)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          width: "100%",
          fontFamily: "sans-serif",
          borderRadius: 36,
        },
      },
      createElement(
        "div",
        {
          style: {
            fontSize: 58,
            lineHeight: 1,
            marginBottom: 8,
          },
        },
        "Rail"
      ),
      createElement(
        "div",
        {
          style: {
            fontSize: 24,
            opacity: 0.95,
            letterSpacing: 2,
          },
        },
        "WANTED"
      )
    ),
    {
      width: size,
      height: size,
    }
  );
}
