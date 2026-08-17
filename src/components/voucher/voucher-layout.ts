import type { VoucherData } from "./voucher-types";

/**
 * خريطة إحداثيات الطباعة على السند الورقي المطبوع مسبقًا.
 * جميع القيم بالمليمتر، مرجعها الزاوية العليا اليسرى لورقة 200×119 مم.
 * لا تغيّر تصميم السند — هذه مواضع البيانات فقط.
 */
export interface FieldBox {
  key: keyof VoucherData | "date" | "accountMark";
  /** المسافة من اليسار (مم) */
  x: number;
  /** المسافة من الأعلى (مم) */
  y: number;
  /** العرض (مم) */
  w: number;
  /** الارتفاع (مم) */
  h: number;
  align?: "right" | "center" | "left";
  size?: number; // حجم الخط بالمليمتر
  bold?: boolean;
}

export const SHEET_W = 200;
export const SHEET_H = 119;

export const FIELD_BOXES: FieldBox[] = [
  { key: "serial", x: 8, y: 36, w: 34, h: 8, align: "center", size: 5, bold: true },
  { key: "amountFigures", x: 132, y: 28, w: 40, h: 8, align: "center", size: 4.4, bold: true },
  { key: "date", x: 62, y: 28, w: 48, h: 8, align: "center", size: 4, bold: true },
  { key: "receiverName", x: 56, y: 39.5, w: 116, h: 8, align: "right", size: 4 },
  { key: "amountWords", x: 128, y: 50.5, w: 44, h: 8, align: "right", size: 3.6 },
  { key: "accountOther", x: 56, y: 50.5, w: 26, h: 8, align: "right", size: 3.2 },
  { key: "reason", x: 56, y: 61.5, w: 116, h: 8, align: "right", size: 4 },
  { key: "signReceiver", x: 140, y: 92, w: 32, h: 6, align: "center", size: 3.4 },
  { key: "signAccountant", x: 100, y: 92, w: 32, h: 6, align: "center", size: 3.4 },
  { key: "signManager", x: 60, y: 92, w: 32, h: 6, align: "center", size: 3.4 },
];

/** مواضع علامات (✕) لصناديق «من حساب» */
export const ACCOUNT_MARKS: Record<"aid" | "petty" | "other", { x: number; y: number }> = {
  aid: { x: 118, y: 53 },
  petty: { x: 104, y: 53 },
  other: { x: 90, y: 53 },
};

export interface Calibration {
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_CALIBRATION: Calibration = { offsetX: 0, offsetY: 0 };
export const CALIBRATION_KEY = "voucher-print-calibration";

export function loadCalibration(): Calibration {
  if (typeof window === "undefined") return DEFAULT_CALIBRATION;
  try {
    const raw = window.localStorage.getItem(CALIBRATION_KEY);
    if (!raw) return DEFAULT_CALIBRATION;
    const parsed = JSON.parse(raw) as Partial<Calibration>;
    return {
      offsetX: Number(parsed.offsetX) || 0,
      offsetY: Number(parsed.offsetY) || 0,
    };
  } catch {
    return DEFAULT_CALIBRATION;
  }
}

export function saveCalibration(c: Calibration) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CALIBRATION_KEY, JSON.stringify(c));
}