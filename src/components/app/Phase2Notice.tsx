export function Phase2Notice({ title, note }: { title: string; note: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">{note}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          المرحلة الأولى مكتملة — بانتظار تأكيدك لبدء المرحلة الثانية.
        </p>
      </div>
    </div>
  );
}
