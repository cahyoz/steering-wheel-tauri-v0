import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";

Live2DModel.registerTicker(PIXI.Ticker);

export default function SteeringScene() {
  const containerRef = useRef(null);

  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const number = useRef(0);
  const hand = useRef({ x: 0 });
  const phase = useRef("idle");

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application({
      width: 1200,
      height: 800,
      backgroundAlpha: 1,
      backgroundColor: 0x04f404,
    });

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(app.view);

    const loadModels = async () => {
      try {
        // Load steering wheel model
        console.log("Loading steering wheel model...");
        const wheelModel = await Live2DModel.from(
          "/l2d_model/steering/steerring.model3.json",
          {
            autoInteract: false,
          }
        );
        app.stage.addChild(wheelModel);

        wheelModel.scale.set(0.5);
        wheelModel.anchor.set(0.5, 0.5);
        wheelModel.position.set(300, 400); // Position on left side

        // Load shifter model
        console.log("Loading shifter model...");
        const shifterModel = await Live2DModel.from(
          "/l2d_model/steering/shifter/shifter.model3.json",
          {
            autoInteract: false,
          }
        );
        app.stage.addChild(shifterModel);

        shifterModel.scale.set(0.5);
        shifterModel.anchor.set(0.5, 0.5);
        shifterModel.position.set(900, 400); // Position on right side

        // Update loop
        app.ticker.add(() => {
          // Update models (handle both PIXI v6 and v7 delta formats)
        //   const deltaTime = typeof delta === 'number' ? delta : delta.deltaTime;
        //   wheelModel.update(deltaTime);
        //   shifterModel.update(deltaTime);

          const gp = navigator.getGamepads()[0];
          if (!gp || !gp.axes) return;

          // Debug: log gamepad state occasionally
        //   if (Math.random() < 0.01) {
        //     console.log('Gamepad detected:', {
        //       axes: gp.axes[0],
        //       buttons: gp.buttons.map((b, i) => ({ index: i, pressed: b.pressed, value: b.value })).filter(b => b.pressed)
        //     });
        //   }

          // Update steering wheel
          try {
            let steer = gp.axes[0];
            const angle = steer * 45;
            wheelModel.internalModel.coreModel.setParameterValueById(
              "SteeringRotation",
              angle
            );
          } catch (err) {
            console.error("Error updating steering wheel:", err);
          }

          // Update shifter
          let buttons = gp.buttons;
          const gearButtons = [12, 13, 14, 15, 16, 17];
          const active = gearButtons.some((i) => buttons[i].value > 0.5);
          const isPressed = (i) => buttons[i].value > 0.5;

          if (isPressed(12)) {
            target.current.x = -30.0;
            target.current.y = 30.0;
            number.current = 1.0;
            phase.current = "moveX";
          } else if (isPressed(13)) {
            target.current.x = -30.0;
            target.current.y = -30.0;
            number.current = 1.2;
            phase.current = "moveX";
          } else if (isPressed(14)) {
            target.current.x = 0.0;
            target.current.y = 30.0;
            number.current = 1.4;
            phase.current = "moveX";
          } else if (isPressed(15)) {
            target.current.x = 0.0;
            target.current.y = -30.0;
            number.current = 1.6;
            phase.current = "moveX";
          } else if (isPressed(16)) {
            target.current.x = 30.0;
            target.current.y = 30.0;
            number.current = 1.8;
            phase.current = "moveX";
          } else if (isPressed(17)) {
            target.current.x = 30.0;
            target.current.y = -30.0;
            number.current = 2.0;
            phase.current = "moveX";
          } else if (!active) {
            target.current.x = 0.0;
            target.current.y = 0.0;
            number.current = 0.0;
            phase.current = "idle";
          }

          const lerp = (a, b, t) => a + (b - a) * t;

          // Move X first
          if (phase.current === "moveX") {
            hand.current.x = lerp(hand.current.x, 1.0, 0.1);
            if (Math.abs(1.0 - hand.current.x) < 0.1) {
              current.current.x = lerp(
                current.current.x,
                target.current.x,
                0.1
              );
            }

            if (Math.abs(current.current.x - target.current.x) < 0.1) {
              phase.current = "moveY";
            }
          }

          if (phase.current === "moveY") {
            current.current.y = lerp(current.current.y, target.current.y, 0.1);
            if (Math.abs(current.current.y - target.current.y) < 0.1) {
              hand.current.x = lerp(hand.current.x, 0.0, 1.0);
            }
          }

          if (phase.current === "idle") {
            hand.current.x = lerp(hand.current.x, 1.0, 0.1);
            current.current.y = lerp(current.current.y, target.current.y, 0.1);
            if (Math.abs(current.current.y - target.current.y) < 0.1) {
              current.current.x = lerp(
                current.current.x,
                target.current.x,
                0.1
              );
              if (Math.abs(current.current.x - target.current.x) < 0.1) {
                hand.current.x = lerp(hand.current.x, 0.0, 1.0);
              }
            }
          }

          try {
            shifterModel.internalModel.coreModel.setParameterValueById(
              "hand",
              hand.current.x
            );
            shifterModel.internalModel.coreModel.setParameterValueById(
              "shifterx",
              current.current.x
            );
            shifterModel.internalModel.coreModel.setParameterValueById(
              "shifterz",
              current.current.y
            );
            shifterModel.internalModel.coreModel.setParameterValueById(
              "num",
              number.current
            );
          } catch (err) {
            console.error("Error updating shifter:", err);
          }
        });
      } catch (err) {
        console.error("Live2D load error:", err);
      }
    };

    loadModels();

    return () => {
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} />;
}
