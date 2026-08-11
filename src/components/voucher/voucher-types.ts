export type AccountKind = "aid" | "petty" | "other" | "none";

export interface VoucherData {
  serial: string;
  amountFigures: string;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  receiverName: string;
  amountWords: string;
  account: AccountKind;
  accountOther: string;
  reason: string;
  signReceiver: string;
  signAccountant: string;
  signManager: string;
}

export const emptyVoucher: VoucherData = {
  serial: "2001",
  amountFigures: "",
  dateDay: "",
  dateMonth: "",
  dateYear: "",
  receiverName: "",
  amountWords: "",
  account: "none",
  accountOther: "",
  reason: "",
  signReceiver: "",
  signAccountant: "",
  signManager: "",
};