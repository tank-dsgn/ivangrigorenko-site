// Секция «Hero» — сгенерировано из Figma.
// Перегенерировать: node tools/figma/generate.mjs autotor-ru --sections

export default function Hero() {
  return (
    <>
      <style>{`
        @media (hover: hover) {
          .hg-1:hover .hn-1-1 { box-shadow: inset 0 0 0 1px #4f46e5 !important; }
          .hg-1:hover .hn-1-2 { color: #4f46e5 !important; }
        }
        @media (prefers-reduced-motion: reduce) { .hg-1, .hg-1 * { transition: none !important; } }
        .hn-2-1 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-2-2 { transition: transform 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-2-3 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), color 300ms cubic-bezier(0, 0, 0.58, 1), font-weight 300ms cubic-bezier(0, 0, 0.58, 1); }
        @media (hover: hover) {
          .hg-2:hover .hn-2-1 { translate: 0px -6px !important; }
          .hg-2:hover .hn-2-2 { transform: translateY(-50%) scale(1.0989, 1.0989) !important; }
          .hg-2:hover .hn-2-3 { translate: 0px -6px !important; color: #4f46e5 !important; font-weight: 700 !important; }
        }
        @media (prefers-reduced-motion: reduce) { .hg-2, .hg-2 * { transition: none !important; } }
        .hn-3-1 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), box-shadow 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-3-2 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), scale 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-3-3 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), color 300ms cubic-bezier(0, 0, 0.58, 1), font-weight 300ms cubic-bezier(0, 0, 0.58, 1); }
        @media (hover: hover) {
          .hg-3:hover .hn-3-1 { translate: 0px -6px !important; box-shadow: 0 8px 24px 0 rgba(64, 62, 92, 0.3) !important; }
          .hg-3:hover .hn-3-2 { translate: 0.14px 0.21px !important; scale: 1.0461 1.0461 !important; }
          .hg-3:hover .hn-3-3 { translate: 0px -6px !important; color: #4f46e5 !important; font-weight: 700 !important; }
        }
        @media (prefers-reduced-motion: reduce) { .hg-3, .hg-3 * { transition: none !important; } }
        .hn-4-1 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-4-2 { transition: transform 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-4-3 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), color 300ms cubic-bezier(0, 0, 0.58, 1), font-weight 300ms cubic-bezier(0, 0, 0.58, 1); }
        @media (hover: hover) {
          .hg-4:hover .hn-4-1 { translate: 0px -6px !important; }
          .hg-4:hover .hn-4-2 { transform: translateX(-50%) scale(1.1, 1.1) !important; }
          .hg-4:hover .hn-4-3 { translate: 0px -6px !important; color: #4f46e5 !important; font-weight: 700 !important; }
        }
        @media (prefers-reduced-motion: reduce) { .hg-4, .hg-4 * { transition: none !important; } }
        .hn-5-1 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), box-shadow 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-5-2 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), scale 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-5-3 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), color 300ms cubic-bezier(0, 0, 0.58, 1), font-weight 300ms cubic-bezier(0, 0, 0.58, 1); }
        @media (hover: hover) {
          .hg-5:hover .hn-5-1 { translate: 0px -6px !important; box-shadow: 0 8px 24px 0 rgba(64, 62, 92, 0.3) !important; }
          .hg-5:hover .hn-5-2 { translate: 4.26px 4.18px !important; scale: 1.184 1.184 !important; }
          .hg-5:hover .hn-5-3 { translate: 0px -6px !important; color: #4f46e5 !important; font-weight: 700 !important; }
        }
        @media (prefers-reduced-motion: reduce) { .hg-5, .hg-5 * { transition: none !important; } }
        .hn-6-1 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), box-shadow 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-6-2 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), scale 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-6-3 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), color 300ms cubic-bezier(0, 0, 0.58, 1), font-weight 300ms cubic-bezier(0, 0, 0.58, 1); }
        @media (hover: hover) {
          .hg-6:hover .hn-6-1 { translate: 0px -6px !important; box-shadow: 0 8px 24px 0 rgba(64, 62, 92, 0.3) !important; }
          .hg-6:hover .hn-6-2 { translate: 0.15px -0.05px !important; scale: 1.0627 1.0626 !important; }
          .hg-6:hover .hn-6-3 { translate: 0px -6px !important; color: #4f46e5 !important; font-weight: 700 !important; }
        }
        @media (prefers-reduced-motion: reduce) { .hg-6, .hg-6 * { transition: none !important; } }
      `}</style>
      {/* Mobile */}
      <div className="figma-page md:hidden">
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "48px 20px 48px 20px", backgroundImage: "linear-gradient(138.91deg, #6ddfcb 0%, #369887 100%)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: "0%", right: "0%", top: "0%", bottom: "0%", flexShrink: 0, backgroundImage: "linear-gradient(180deg, rgba(78, 193, 173, 0) 0%, rgba(44, 47, 48, 0.408) 62.5%, rgba(0, 0, 0, 0.6) 100%)" }} />
        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
          <div style={{ alignSelf: "stretch", aspectRatio: "347 / 197", position: "relative", overflow: "hidden" }}>
            <img src="/a/23fba15410e9396f49b111b8154ae779b090e4da.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" style={{ position: "absolute", left: "0.14%", top: "-3.55%", width: "99.71%", height: "101.27%", maxWidth: "none" }} />
          </div>
          <p style={{ alignSelf: "stretch", width: "min-content", minWidth: "100%", fontSize: "16px", lineHeight: "24px", fontWeight: 600, textAlign: "center", color: "#e2e8f0" }}>{`Разработка Платных Функции для Autotor.pl — UX/UI Дизайн, Монетизация`}</p>
        </div>
      </div>
      </div>
      {/* Tablet */}
      <div className="figma-page hidden md:block xl:hidden">
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "64px 20px 64px 20px", backgroundImage: "linear-gradient(138.91deg, #6ddfcb 0%, #369887 100%)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: "0", right: "0", top: "0", bottom: "0", flexShrink: 0, backgroundImage: "linear-gradient(180deg, rgba(78, 193, 173, 0) 0%, rgba(44, 47, 48, 0.408) 62.5%, rgba(0, 0, 0, 0.6) 100%)" }} />
        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
          <div style={{ alignSelf: "stretch", aspectRatio: "760 / 409", position: "relative", overflow: "hidden" }}>
            <img src="/a/23fba15410e9396f49b111b8154ae779b090e4da.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" style={{ position: "absolute", left: "0.14%", top: "-3.75%", width: "99.71%", height: "106.83%", maxWidth: "none" }} />
          </div>
          <p style={{ alignSelf: "stretch", width: "min-content", minWidth: "100%", fontSize: "18px", lineHeight: "28px", fontWeight: 600, textAlign: "center", color: "#e2e8f0" }}>{`Разработка Платных Функции для Autotor.pl — UX/UI Дизайн, Монетизация`}</p>
        </div>
      </div>
      </div>
      {/* Desktop */}
      <div className="figma-page hidden xl:block">
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "120px 160px 120px 160px", backgroundImage: "linear-gradient(138.91deg, #6ddfcb 0%, #369887 100%)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: "0%", right: "0%", top: "0%", bottom: "0%", flexShrink: 0, backgroundImage: "linear-gradient(180deg, rgba(78, 193, 173, 0) 0%, rgba(44, 47, 48, 0.408) 62.5%, rgba(0, 0, 0, 0.6) 100%)" }} />
        <div style={{ width: "880px", display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
          <div style={{ alignSelf: "stretch", height: "528px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "14.67px", justifyContent: "center", alignItems: "center", position: "relative" }}>
            <p style={{ position: "absolute", left: "calc(50% + 0px)", top: "calc(50% + -0.5px)", transform: "translateX(-50%) translateY(-50%)", fontSize: "255px", lineHeight: "normal", fontWeight: 600, textAlign: "center", color: "rgba(57, 129, 117, 0.17)", whiteSpace: "nowrap" }}>{`AUTOTOR`}</p>
            <span style={{ width: "880px", height: "530.75px", flexShrink: 0, position: "relative" }}>
              <img src="/a/3e25172e72a63a6ff97ef62382ea02d6462aeade.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" style={{ position: "absolute", left: "0%", width: "100%", top: "0%", height: "102.6%", maxWidth: "none" }} />
            </span>
          </div>
          <p style={{ fontSize: "24px", lineHeight: "32px", fontWeight: 600, textAlign: "center", color: "#ffffff", whiteSpace: "nowrap" }}>{`Разработка Платных Функции для Autotor.pl — UX/UI Дизайн, Монетизация`}</p>
        </div>
      </div>
      </div>
    </>
  );
}
