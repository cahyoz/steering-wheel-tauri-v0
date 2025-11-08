import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";

Live2DModel.registerTicker(PIXI.Ticker);

export default function Model() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application({
      view: document.createElement("canvas"),
      backgroundAlpha: 1,
      width: 1280,
      height: 720,
      backgroundColor: 0x04f404,
    });

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(app.view);

    const loadModel = async () => {
      try {
        console.log("Loading Live2D model...");
        const model = await Live2DModel.from(
          "/l2d_model/steering/steerring.model3.json",
          {
            autoInteract: false,
          }
        );
        app.stage.addChild(model);

        app.ticker.add(() => {
          const gp = navigator.getGamepads()[0];
          if (!gp || !gp.axes) return;

          let steer = gp.axes[0];

          const angle = steer * 45;
          model.internalModel.coreModel.setParameterValueById(
            "SteeringRotation",
            angle
          );
        });
      } catch (err) {
        console.error("Live2D load error:", err);
      }
    };

    loadModel();

    return () => {
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} />;
}
