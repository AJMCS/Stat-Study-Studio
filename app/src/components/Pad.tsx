import { useEffect, useRef, useState } from "react";
import { Math as Tex, RichText } from "./Math";

export interface PadValue {
  text: string;
  drawing: string | null;
}

/**
 * Answer pad: typed text with $LaTeX$ live preview, plus an optional freeform drawing canvas.
 * Typing is always sufficient; drawing is never required.
 */
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
  const [showCanvas, setShowCanvas] = useState(!!value.drawing);
  const [erase, setErase] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !showCanvas) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    if (value.drawing) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
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
    canvas.current!.setPointerCapture(e.pointerId);
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
    ctx.strokeStyle = erase ? "#fff" : "#111";
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
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
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
        <button type="button" className="ghost btn-sm" onClick={() => setShowCanvas((s) => !s)} aria-expanded={showCanvas}>
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
      )}
    </div>
  );
}

export const emptyPad = (): PadValue => ({ text: "", drawing: null });
export const padToText = (v: PadValue) => v.text + (v.drawing ? " [drawing attached]" : "");
export { Tex };
