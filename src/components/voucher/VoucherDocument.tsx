import type { VoucherData } from "./voucher-types";

/**
 * نموذج طباعة سند الصرف النقدي.
 * المرجع الوحيد للتصميم هو ملف "سند صرف نقدي.pdf" المرفق.
 * المقاس المعتمد: 200 مم × 119 مم.
 */
export function VoucherDocument({
  data,
  mode,
}: {
  data: VoucherData;
  mode: "full" | "values";
}) {
  const showTemplate = mode === "full";

  return (
    <div className="voucher-sheet" dir="rtl">
      {showTemplate && <div className="voucher-frame" aria-hidden />}

      {/* المحتوى الرئيسي */}
      <div className="voucher-main">
        {showTemplate && (
          <div className="voucher-head">
            <div className="voucher-head-right">
              <div className="voucher-org">جمعية البر بالأحساء</div>
              <div className="voucher-reg">
                مسجلة بوزارة الشؤون الاجتماعية برقم : 34
              </div>
            </div>
            <div className="voucher-title">سند صرف نقدي</div>
          </div>
        )}

        <div className="voucher-body">
          <div className="voucher-row">
            <div className="voucher-cell">
              {showTemplate && <span className="voucher-label-plain">ريـــال</span>}
              <div className="voucher-box voucher-box--ticks">{data.amountFigures}</div>
            </div>
            <div className="voucher-cell">
              {showTemplate && <span className="voucher-label-plain">التاريخ</span>}
              <div className="voucher-box voucher-date">
                <span>{data.dateDay}</span>
                {showTemplate && <span className="voucher-slash">/</span>}
                <span>{data.dateMonth}</span>
                {showTemplate && <span className="voucher-slash">/</span>}
                <span>{data.dateYear}</span>
                {showTemplate && <span className="voucher-hijri">١٤هـ</span>}
              </div>
            </div>
          </div>

          <div className="voucher-row">
            {showTemplate && <span className="voucher-tag">لقد استلمت أنا</span>}
            <div className="voucher-box voucher-box--grow">{data.receiverName}</div>
          </div>

          <div className="voucher-row">
            {showTemplate && <span className="voucher-tag">مبلغ وقدره</span>}
            <div className="voucher-box voucher-box--words">{data.amountWords}</div>
            {showTemplate && <span className="voucher-tag">من حساب</span>}
            <div className="voucher-box voucher-box--accounts">
              <label className="voucher-check">
                <span className="voucher-square">{data.account === "aid" ? "✕" : ""}</span>
                {showTemplate && "المساعدات"}
              </label>
              <label className="voucher-check">
                <span className="voucher-square">{data.account === "petty" ? "✕" : ""}</span>
                {showTemplate && "النثريات"}
              </label>
              <label className="voucher-check">
                <span className="voucher-square">{data.account === "other" ? "✕" : ""}</span>
                {showTemplate && "أخرى"}
              </label>
              <span className="voucher-other">
                {data.account === "other" ? data.accountOther : showTemplate ? "............" : ""}
              </span>
            </div>
          </div>

          <div className="voucher-row">
            {showTemplate && <span className="voucher-tag">وذلـــك عن</span>}
            <div className="voucher-box voucher-box--grow">{data.reason}</div>
          </div>

          <div className="voucher-signs">
            {[
              { title: "المستلم", name: data.signReceiver },
              { title: "محاسب المركز", name: data.signAccountant },
              { title: "مدير المركز", name: data.signManager },
            ].map((col) => (
              <div className="voucher-sign" key={col.title}>
                {showTemplate && <div className="voucher-sign-title">{col.title}</div>}
                <div className="voucher-sign-line">
                  {showTemplate && <span>الاســم /</span>}
                  <span className="voucher-sign-value">{col.name}</span>
                </div>
                <div className="voucher-sign-line">
                  {showTemplate && <span>التوقيع /</span>}
                  <span className="voucher-sign-value" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {showTemplate && <div className="voucher-code">SSNKD_11_02_MZ</div>}
      </div>

      {/* الشريط الجانبي */}
      {showTemplate ? (
        <aside className="voucher-side">
          <div className="voucher-logo">
            {/* الشعار غير متوفر كملف مستقل — يحتاج مراجعة لاحقة */}
            <span>جمعية البر بالأحساء</span>
          </div>
          <div className="voucher-center">مركز المزروعية</div>
          <div className="voucher-serial">{data.serial}</div>
          <div className="voucher-address">
            <div>الأحساء - الهفوف - المزروعية</div>
            <div>قرب جامع المزروعية الكبير</div>
            <div>
              هاتف : <span dir="ltr">03 5871544</span>
            </div>
            <div>
              ناسخ : <span dir="ltr">03 5847014</span>
            </div>
            <div>
              ص . ب : <span dir="ltr">2248</span> _ الأحساء : <span dir="ltr">31982</span>
            </div>
            <div>البريد الإلكتروني</div>
            <div>mazroaiyah@ahsaber.org</div>
          </div>
          <div className="voucher-web">www.ahsaber.org</div>
        </aside>
      ) : (
        <aside className="voucher-side voucher-side--blank">
          <div className="voucher-serial voucher-serial--blank">{data.serial}</div>
        </aside>
      )}
    </div>
  );
}