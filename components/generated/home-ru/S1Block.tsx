// Секция «1 block» — сгенерировано из Figma.
// Перегенерировать: node tools/figma/generate.mjs home-ru --sections

import ContactButton from "@/components/ContactButton";

export default function S1Block() {
  return (
    <>
      {/* Mobile */}
      <div className="figma-page md:hidden">
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "40px 20px 40px 20px", background: "#ffffff", overflow: "hidden" }}>
        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
          <p style={{ alignSelf: "stretch", width: "min-content", minWidth: "100%", fontSize: "17px", lineHeight: "normal", fontWeight: 400, color: "#64748b" }}>{`Я Иван Григоренко — UX/UI дизайнер`}</p>
          <p style={{ alignSelf: "stretch", width: "min-content", minWidth: "100%", fontSize: "20px", lineHeight: "normal", fontWeight: 700, color: "#0f172a" }}>{`Создаю понятные, эстетичные и продуманные `}<span style={{ color: "#4f46e5" }}>{`цифровые`}</span>{` продукты`}</p>
        </div>
        <div style={{ alignSelf: "stretch", flexShrink: 0, marginTop: "20px" }}>
          <ContactButton lang="ru" full />
        </div>
      </div>
      </div>
      {/* Tablet */}
      <div className="figma-page hidden md:block xl:hidden">
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 80px 56px 80px", background: "#ffffff", overflow: "hidden" }}>
        <div style={{ width: "720px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", position: "relative" }}>
          <p style={{ alignSelf: "stretch", width: "min-content", minWidth: "100%", fontSize: "28px", lineHeight: "36px", fontWeight: 400, color: "#64748b" }}>{`Привет, я Иван Григоренко — UX/UI дизайнер`}</p>
          <p style={{ alignSelf: "stretch", width: "min-content", minWidth: "100%", fontSize: "35px", lineHeight: "40px", fontWeight: 700, color: "#0f172a" }}>{`Создаю понятные, эстетичные и продуманные `}<span style={{ color: "#4f46e5" }}>{`цифровые`}</span>{` продукты`}</p>
          <span style={{ position: "absolute", left: "455px", right: "248.33px", top: "123px", height: "20px", flexShrink: 0 }}>
            <img src="/a/2a06b471d4de3127fbd46048360701923de8101d.svg" alt="" aria-hidden="true" loading="lazy" decoding="async" style={{ position: "absolute", left: "-60.15%", width: "235.82%", top: "-46.17%", height: "224.26%", maxWidth: "none" }} />
          </span>
        </div>
        <div style={{ width: "720px", flexShrink: 0, marginTop: "24px" }}>
          <ContactButton lang="ru" full />
        </div>
      </div>
      </div>
      {/* Desktop */}
      <div className="figma-page hidden xl:block">
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "120px 191px 120px 191px", background: "#ffffff", overflow: "hidden" }}>
        <div style={{ width: "898px", height: "172px", flexShrink: 0, position: "relative" }}>
          <p style={{ position: "absolute", left: "0", top: "0", fontSize: "36px", lineHeight: "40px", fontWeight: 400, color: "#64748b", whiteSpace: "nowrap" }}>{`Привет, я Иван Григоренко — UX/UI дизайнер`}</p>
          <p style={{ position: "absolute", left: "0", right: "0", bottom: "16px", fontSize: "48px", lineHeight: "48px", fontWeight: 700, color: "#0f172a" }}>{`Создаю понятные, эстетичные и продуманные `}<span style={{ color: "#4f46e5" }}>{`цифровые`}</span>{` продукты`}</p>
          <span style={{ position: "absolute", left: "624px", bottom: "-3px", width: "20px", height: "24px" }}>
            <img src="/a/3124b15427ab957b9ad6f72de3a4cb4968ec1ef0.svg" alt="" aria-hidden="true" loading="lazy" decoding="async" style={{ position: "absolute", left: "-60.15%", width: "235.82%", top: "-46.17%", height: "224.26%", maxWidth: "none" }} />
          </span>
        </div>
        <div style={{ width: "898px", flexShrink: 0, marginTop: "16px" }}>
          <ContactButton lang="ru" full />
        </div>
      </div>
      </div>
    </>
  );
}
