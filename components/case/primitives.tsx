import type { CSSProperties, ReactNode } from "react";

/**
 * Типографика кейсов — одна шкала на все страницы.
 * Значения сняты с макета: телефон / планшет / десктоп.
 *
 *   заголовок секции   24/32 Bold   →  24/32  →  36/40
 *   основной текст     16/24        →  16/24  →  20/28
 *   подпись блока      12/16        →  12/16  →  14/20
 */
export const caseType = {
  title: "text-[24px] leading-8 font-bold text-ink xl:text-[36px] xl:leading-10",
  body: "text-[16px] leading-6 text-body xl:text-[20px] xl:leading-7",
  label: "text-[12px] leading-4 uppercase text-muted xl:text-[14px] xl:leading-5",
} as const;

/** Ширина колонки с контентом: 335 → 720 → 1024 */
export const caseWidth = "w-full max-w-[335px] md:max-w-[720px] xl:max-w-[1024px]";

/**
 * Секция кейса.
 *
 * Отступы на телефоне и планшете одинаковые во всех секциях (32/20 и 40/40),
 * а на десктопе отличаются от секции к секции — поэтому они приходят пропсами
 * и подставляются через CSS-переменные, чтобы значения остались точными.
 */
export function CaseSection({
  background,
  padY = 100,
  padX = 122,
  gap = 40,
  width = "1024px",
  children,
}: {
  background?: string;
  /** вертикальный отступ на десктопе */
  padY?: number;
  /** горизонтальный отступ на десктопе */
  padX?: number;
  /** расстояние между блоками внутри секции на десктопе */
  gap?: number;
  /** ширина контентной колонки на десктопе */
  width?: string;
  children: ReactNode;
}) {
  return (
    <section
      className="flex flex-col items-center px-5 py-8 md:px-10 md:py-10 xl:px-[var(--pad-x)] xl:py-[var(--pad-y)]"
      style={
        {
          background,
          "--pad-x": `${padX}px`,
          "--pad-y": `${padY}px`,
          "--gap": `${gap}px`,
          "--w": width,
        } as CSSProperties
      }
    >
      <div className="flex w-full max-w-[335px] flex-col gap-6 md:max-w-[720px] xl:max-w-[var(--w)] xl:gap-[var(--gap)]">
        {children}
      </div>
    </section>
  );
}

/** Заголовок секции с лид-абзацем под ним */
export function CaseHeading({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="flex flex-col gap-2 xl:gap-4">
      <h2 className={caseType.title}>{title}</h2>
      {lead && <p className={caseType.body}>{lead}</p>}
    </div>
  );
}

/** Блок с мелкой подписью сверху */
export function CaseBlock({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      {label && <p className={caseType.label}>{label}</p>}
      {children}
    </div>
  );
}

/** Колонка «подпись — значение», как в блоке роли и сроков */
export function CaseMeta({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-col gap-6 xl:gap-8">
      {items.map((i) => (
        <div key={i.label} className="flex flex-col gap-2">
          <p className={caseType.label}>{i.label}</p>
          <p className={caseType.body}>{i.value}</p>
        </div>
      ))}
    </div>
  );
}
