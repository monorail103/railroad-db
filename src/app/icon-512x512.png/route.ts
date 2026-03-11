import { ImageResponse } from "next/og";
import { createElement } from "react";

export const runtime = "edge";

function buildIcon(size: number) {
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
          borderRadius: size / 5,
        },
      },
      createElement(
        "div",
        {
          style: {
            fontSize: size * 0.34,
            lineHeight: 1,
            marginBottom: size * 0.05,
          },
        },
        "Rail"
      ),
      createElement(
        "div",
        {
          style: {
            fontSize: size * 0.14,
            opacity: 0.95,
            letterSpacing: size * 0.012,
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

export function GET() {
  return buildIcon(512);
}
