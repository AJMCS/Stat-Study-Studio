import { useEffect, useRef, useState } from "react";
import { Math as Tex, RichText } from "./Math";

export interface PadValue {
  text: string;
  drawing: string | null;
}

/**
 * Answer pad: typed text with $LaTeX$ live preview, plus an optional freeform drawing canvas.
 * Typing is always sufficient; drawing is never required.
 *
 * The canvas is transparent and sits on the theme's input background; strokes are always drawn in near-black, and in
 * dark mode the stylesheet inverts the canvas so the same strokes read as chalk. A saved drawing is therefore theme
 * independent (black ink on nothing) and keeps its contrast if the theme changes after it was drawn.
 */
const PEN = "#0d0f14"; // inverts to exactly the dark theme's chalk ink (#f2f0eb); reads as black in light mode
/** Whether the learner last left the drawing pad open, so the next question's pad opens the same way. */
let padWasOpen = false;

/** Drawings saved by an earlier version had a white background baked in; make that transparent so it takes the theme. */
function dropWhite(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) if (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240) d[i + 3] = 0;
  ctx.putImageData(img, 0, 0);
}
export function Pad({
  value,
  onChange,
  label = "Your work",
  disabled = false,
}: {
  value: PadValue;
  onChange: (v: PadValue) => void;
  label?: string;
  disabled?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  // Open when this answer already has a drawing, or when the learner opened the pad on an earlier question: a quiz or
  // exam mounts one Pad per question (keyed by the question), so each question keeps its own drawing and a fresh
  // question starts blank, while the pad itself stays open from question to question.
  const [showCanvas, setShowCanvas] = useState(!!value.drawing || padWasOpen);
  const [erase, setErase] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !showCanvas) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    if (value.drawing) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        dropWhite(ctx, c.width, c.height);
      };
      img.src = value.drawing;
    }
    // Only restore when the canvas is first shown or the question changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCanvas]);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * canvas.current!.width, y: ((e.clientY - r.top) / r.height) * canvas.current!.height };
  };

  const down = (e: React.PointerEvent) => {
    if (disabled) return;
    drawing.current = true;
    try {
      canvas.current!.setPointerCapture(e.pointerId); // keeps the stroke when the pointer leaves the canvas mid-line
    } catch {
      /* a pointer that cannot be captured (some pens, synthetic events) still draws; it just stops at the edge */
    }
    const ctx = canvas.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext("2d")!;
    ctx.lineWidth = erase ? 18 : 2.5;
    ctx.lineCap = "round";
    // The eraser removes ink rather than painting over it, so the theme's background shows through again.
    ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
    ctx.strokeStyle = PEN;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange({ ...value, drawing: canvas.current!.toDataURL("image/png") });
  };
  const clear = () => {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    onChange({ ...value, drawing: null });
  };

  const hasLatex = /\$[^$]+\$/.test(value.text);

  return (
    <div className="pad">
      <label className="field">
        <span>{label}</span>
        <textarea
          rows={6}
          value={value.text}
          disabled={disabled}
          placeholder="Type your work. Wrap math in $...$, e.g. $\bar{x} \pm z^* \frac{\sigma}{\sqrt{n}}$"
          onChange={(e) => onChange({ ...value, text: e.target.value })}
        />
      </label>
      {hasLatex && (
        <div className="preview" aria-label="Math preview">
          <small>Preview</small>
          <p>
            <RichText text={value.text} />
          </p>
        </div>
      )}
      <div className="row">
        <button
          type="button"
          className="ghost btn-sm"
          onClick={() =>
            setShowCanvas((s) => {
              padWasOpen = !s;
              return !s;
            })
          }
          aria-expanded={showCanvas}
        >
          {showCanvas ? "Hide drawing pad" : "Add a drawing (optional)"}
        </button>
        {showCanvas && !disabled && (
          <>
            <button type="button" className="ghost btn-sm" aria-pressed={erase} onClick={() => setErase((e) => !e)}>
              {erase ? "Eraser on" : "Pen"}
            </button>
            <button type="button" className="ghost btn-sm" onClick={clear}>
              Clear drawing
            </button>
          </>
        )}
      </div>
      {showCanvas && (
        <div className="canvas-wrap">
          <canvas
            ref={canvas}
            width={800}
            height={360}
            className="canvas"
            role="img"
            aria-label="Drawing pad. Typing in the text box above is always enough; drawing is optional."
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerLeave={up}
          />
        </div>
      )}
    </div>
  );
}

export const emptyPad = (): PadValue => ({ text: "", drawing: null });
export const padToText = (v: PadValue) => v.text + (v.drawing ? " [drawing attached]" : "");
export { Tex };
