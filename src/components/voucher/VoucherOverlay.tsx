import {
  ACCOUNT_MARKS,
  FIELD_BOXES,
  SHEET_H,
  SHEET_W,
  type Calibration,
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
}: {
  data: VoucherData;
  calibration: Calibration;
  guides?: boolean;
}) {
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
            className="voucher-overlay-field"
            style={{
              insetInlineStart: "auto",
              left: `${b.x}mm`,
              top: `${b.y}mm`,
              width: `${b.w}mm`,
              height: `${b.h}mm`,
              justifyContent:
                b.align === "center" ? "center" : b.align === "left" ? "flex-start" : "flex-end",
              fontSize: `${b.size ?? 3.6}mm`,
              fontWeight: b.bold ? 700 : 500,
            }}
          >
            <span className="voucher-overlay-text">{value(b.key as string)}</span>
          </div>
        ))}

        {data.account !== "none" && ACCOUNT_MARKS[data.account] && (
          <div
            className="voucher-overlay-mark"
            style={{
              left: `${ACCOUNT_MARKS[data.account]!.x}mm`,
              top: `${ACCOUNT_MARKS[data.account]!.y}mm`,
            }}
          >
            ✕
          </div>
        )}
      </div>
    </div>
  );
}