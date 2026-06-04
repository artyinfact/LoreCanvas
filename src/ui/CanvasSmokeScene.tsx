import { Application, extend } from "@pixi/react";
import { Container, Graphics, Text } from "pixi.js";
import { useCallback, useRef } from "react";
import type { Graphics as PixiGraphics } from "pixi.js";

extend({
  Container,
  Graphics,
  Text,
});

export function CanvasSmokeScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const drawBoard = useCallback((graphics: PixiGraphics) => {
    graphics.clear();
    graphics
      .roundRect(24, 24, 432, 272, 18)
      .fill({ color: 0x18233a })
      .stroke({ color: 0x78dcca, width: 2, alpha: 0.72 });
    graphics
      .moveTo(128, 112)
      .lineTo(232, 168)
      .lineTo(348, 108)
      .stroke({ color: 0xb8c7ff, width: 4, alpha: 0.78, cap: "round" });

    [
      { x: 128, y: 112, color: 0x78dcca },
      { x: 232, y: 168, color: 0xf5c870 },
      { x: 348, y: 108, color: 0xf08a7a },
    ].forEach(({ x, y, color }) => {
      graphics.circle(x, y, 22).fill({ color, alpha: 0.95 });
      graphics.circle(x, y, 28).stroke({ color, width: 2, alpha: 0.38 });
    });
  }, []);

  return (
    <div className="canvas-frame" ref={hostRef} aria-label="PixiJS smoke scene">
      <Application
        antialias
        autoDensity
        background={0x0d1324}
        height={320}
        resolution={window.devicePixelRatio}
        resizeTo={hostRef}
        width={480}
      >
        <pixiContainer>
          <pixiGraphics draw={drawBoard} />
          <pixiText
            text="Node-Graph ready"
            x={42}
            y={254}
            style={{
              fill: "#eff7ff",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize: 22,
              fontWeight: "700",
            }}
          />
        </pixiContainer>
      </Application>
    </div>
  );
}
