import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";

Live2DModel.registerTicker(PIXI.Ticker);

export default function Shifter() {
  const containerRef = useRef(null);

  const target = useRef({x:0, y:0});
  const current = useRef({x:0, y:0});
  const number = useRef(0);
  const hand = useRef({x:0});
  const phase = useRef("idle");

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application({
      view: document.createElement("canvas"),
      backgroundAlpha: 1,
      resizeTo: window,
      backgroundColor: 0x04f404,
    });

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(app.view);

    const loadModel = async () => {
      try {
        console.log("Loading Live2D model...");
        const model = await Live2DModel.from(
          "/l2d_model/steering/shifter/shifter.model3.json",
          {
            autoInteract: false,
          }
        );

        app.ticker.add(() => {
          const gp = navigator.getGamepads()[0];
          if (!gp || !gp.axes) return;

          let buttons = gp.buttons;

          const gearButtons = [12, 13, 14, 15, 16, 17];
        const active = gearButtons.some(i => buttons[i].value > 0.5);
          const isPressed = (i) => buttons[i].value > 0.5;
            if (isPressed(12)){
                target.current.x = -30.0;
                target.current.y = 30.0;
                number.current = 1.0;
                phase.current = "moveX";
            }
            else if (isPressed(13)){
                target.current.x = -30.0;
                target.current.y = -30.0;
                number.current = 1.2;
                phase.current = "moveX";
            }
            else if (isPressed(14)){
                target.current.x = 0.0;
                target.current.y = 30.0;
                number.current = 1.4;
                phase.current = "moveX";
            }
            else if (isPressed(15)){
                target.current.x = 0.0;
                target.current.y = -30.0;
                number.current = 1.6;
                phase.current = "moveX";
            }
            else if (isPressed(16)){
                target.current.x = 30.0;
                target.current.y = 30.0;
                number.current = 1.8;
                phase.current = "moveX";
            }
            else if (isPressed(17)){
                target.current.x = 30.0;
                target.current.y = -30.0;
                number.current = 5.0;
                phase.current = "moveX";
            }
            else if (!active){
                target.current.x = 0.0;
                target.current.y = 0.0;
                number.current = 0.0;
                phase.current = "idle";
            }

           const lerp = (a, b, t) => a + (b - a) * t;

            // ✅ Move X first
            if (phase.current === "moveX") {
                hand.current.x = lerp(hand.current.x, 1.0, 0.1);
                if (Math.abs(1.0 - hand.current.x) < 0.1) {
                    current.current.x = lerp(current.current.x, target.current.x, 5.0);
                }


                // ✅ Use “close enough”
                if (Math.abs(current.current.x - target.current.x) < 0.1) {
                    phase.current = "moveY";
                }
            } 
             if (phase.current === "moveY") {
                current.current.y = lerp(current.current.y, target.current.y, 5.0);
                if (Math.abs(current.current.y - target.current.y) < 0.1) {
                    hand.current.x = lerp(hand.current.x, 0.0, 1.0);
                }
            }

            if (phase.current === "idle") {
                hand.current.x = lerp(hand.current.x, 1.0, 0.1);
                current.current.y = lerp(current.current.y, target.current.y, 5.0);
                if (Math.abs(current.current.y - target.current.y) < 0.1) {
                    current.current.x = lerp(current.current.x, target.current.x, .0);
                    if (Math.abs(current.current.x - target.current.x) < 0.1) {
                        hand.current.x = lerp(hand.current.x, 0.0, 1.0);
                                    
                }
                }

            }

            model.internalModel.coreModel.setParameterValueById("hand", hand.current.x);
            model.internalModel.coreModel.setParameterValueById("shifterx", current.current.x);
            model.internalModel.coreModel.setParameterValueById("shifterz", current.current.y);
            model.internalModel.coreModel.setParameterValueById("num", number.current);
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
