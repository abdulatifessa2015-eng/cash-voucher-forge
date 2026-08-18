import { useRef } from "react";
import {
  ACCOUNT_MARKS,
  FIELD_BOXES,
  SHEET_H,
  SHEET_W,
  type Calibration,
  type FieldOffsets,
} from "./voucher-layout";
import type { VoucherData } from "./voucher-types";

/**
 * طبقة البيانات فقط — تُطبع فوق السند الورقي المطبوع مسبقًا.
 * كل الإحداثيات بالمليمتر حتى لا تتأثر بحجم الشاشة أو دقتها.
 */
export function VoucherOverlay({
  data,
  calibration,
  guides = false,
  offsets = {},
  editable = false,
  onMoveField,
}: {
  data: VoucherData;
  calibration: Calibration;
  guides?: boolean;
  offsets?: FieldOffsets;
  editable?: boolean;
  onMoveField?: (key: string, dx: number, dy: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  const off = (key: string) => offsets[key] ?? { dx: 0, dy: 0 };

  const startDrag = (key: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!editable || !onMoveField) return;
    e.preventDefault();
    const root = rootRef.current;
    if (!root) return;
    const mmPerPx = SHEET_W / root.getBoundingClientRect().width;
    const startX = e.clientX;
    const startY = e.clientY;
    const base = off(key);
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent) => {
      onMoveField(
        key,
        Math.round((base.dx + (ev.clientX - startX) * mmPerPx) * 10) / 10,
        Math.round((base.dy + (ev.clientY - startY) * mmPerPx) * 10) / 10,
      );
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", up);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
  };

  const value = (key: string): string => {
    if (key === "date") {
      const d = [data.dateDay, data.dateMonth, data.dateYear].filter(Boolean);
      return d.length ? d.join(" / ") : "";
    }
    if (key === "accountOther") return data.account === "other" ? data.accountOther : "";
    return (data as unknown as Record<string, string>)[key] ?? "";
  };

  return (
    <div
      ref={rootRef}
      className={`voucher-overlay${guides ? " voucher-overlay--guides" : ""}`}
      dir="rtl"
      style={{ width: `${SHEET_W}mm`, height: `${SHEET_H}mm` }}
    >
      <div
        className="voucher-overlay-layer"
        style={{ transform: `translate(${calibration.offsetX}mm, ${calibration.offsetY}mm)` }}
      >
        {FIELD_BOXES.map((b) => (
          <div
            key={b.key}
            className={`voucher-overlay-field${editable ? " voucher-overlay-field--draggable" : ""}`}
            onPointerDown={startDrag(b.key as string)}
            style={{
              insetInlineStart: "auto",
              left: `${b.x + off(b.key as string).dx}mm`,
              top: `${b.y + off(b.key as string).dy}mm`,
              width: `${b.w}mm`,
              height: `${b.h}mm`,
              justifyContent:
                b.align === "center" ? "center" : b.align === "left" ? "flex-start" : "flex-end",
              fontSize: `${b.size ?? 3.6}mm`,
              fontWeight: b.bold ? 700 : 500,
              ...(editable ? { cursor: "move", touchAction: "none" as const } : null),
            }}
          >
            <span className="voucher-overlay-text">
              {editable ? value(b.key as string) || b.key : value(b.key as string)}
            </span>
          </div>
        ))}

        {data.account !== "none" && ACCOUNT_MARKS[data.account] && (
          <div
            className={`voucher-overlay-mark${editable ? " voucher-overlay-field--draggable" : ""}`}
            onPointerDown={startDrag("accountMark")}
            style={{
              left: `${ACCOUNT_MARKS[data.account]!.x + off("accountMark").dx}mm`,
              top: `${ACCOUNT_MARKS[data.account]!.y + off("accountMark").dy}mm`,
              ...(editable ? { cursor: "move", touchAction: "none" as const } : null),
            }}
          >
            ✕
          </div>
        )}
      </div>
    </div>
  );
}