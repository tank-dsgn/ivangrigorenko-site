// Секция «Hero» — сгенерировано из Figma.
// Перегенерировать: node tools/figma/generate.mjs mikulich-ru --sections

export default function Hero() {
  return (
    <>
      <style>{`
        .hn-1-1 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-1-2 { transition: transform 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-1-3 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), color 300ms cubic-bezier(0, 0, 0.58, 1), font-weight 300ms cubic-bezier(0, 0, 0.58, 1); }
        @media (hover: hover) {
          .hg-1:hover .hn-1-1 { translate: 0px -6px !important; }
          .hg-1:hover .hn-1-2 { transform: translateY(-50%) scale(1.0989, 1.0989) !important; }
          .hg-1:hover .hn-1-3 { translate: 0px -6px !important; color: #4f46e5 !important; font-weight: 700 !important; }
        }
        @media (prefers-reduced-motion: reduce) { .hg-1, .hg-1 * { transition: none !important; } }
        .hn-2-1 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), box-shadow 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-2-2 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), scale 300ms cubic-bezier(0, 0, 0.58, 1); }
        .hn-2-3 { transition: translate 300ms cubic-bezier(0, 0, 0.58, 1), color 300ms cubic-bezier(0, 0, 0.58, 1), font-weight 300ms cubic-bezier(0, 0, 0.58, 1); }
        @media (hover: hover) {
          .hg-2:hover .hn-2-1 { translate: 0px -6px !important; box-shadow: 0 8px 24px 0 rgba(64, 62, 92, 0.3) !important; }
          .hg-2:hover .hn-2-2 { translate: -1.1px -6.5px !important; scale: 1.0459 1.0459 !important; }
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
      `}</style>
      {/* Mobile */}
      <div className="figma-page md:hidden">
      <div style={{ alignSelf: "stretch", height: "406px", flexShrink: 0, overflow: "hidden", position: "relative" }}>
        <div data-parallax="0.84" style={{ position: "absolute", left: "0", right: "-905px", top: "0", bottom: "-365px", overflow: "hidden", transform: "translateY(var(--parallax, 0px))", willChange: "transform" }}>
          <div style={{ position: "absolute", left: "-157px", right: "799.85px", top: "calc(50% + -184.95px)", transform: "translateY(-50%)", aspectRatio: "2693 / 4096", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundImage: "url(/a/37c1e534ac6fc7faeccf8d80ac49543e307631e3.webp)" }} />
          <div style={{ position: "absolute", left: "0", right: "905px", top: "0", bottom: "365px", background: "rgba(24, 41, 52, 0.8)" }} />
        </div>
        <div style={{ position: "absolute", left: "0", right: "0", bottom: "0", height: "303px", backgroundImage: "linear-gradient(180deg, rgba(4, 13, 4, 0) 0%, #040d04 100%)" }} />
        <img
          src="/a/6f43d747c593ad86e6960c031d4d2e12448afb5e.svg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          style={{ position: "absolute", left: "calc(50% + -113.5px)", top: "calc(50% + -76px)", width: "227.7px", height: "103px" }}
        />
        <p style={{ position: "absolute", left: "20px", right: "20px", top: "calc(50% + 95px)", transform: "translateY(-50%)", fontSize: "16px", lineHeight: "24px", fontWeight: 600, textAlign: "center", color: "#e2e8f0" }}>{`Разработка Логотипа для Хирурга Дмитрия Микулича — Айдентика, Брендинг`}</p>
      </div>
      </div>
      {/* Tablet */}
      <div className="figma-page hidden md:block xl:hidden">
      <div style={{ alignSelf: "stretch", height: "453px", flexShrink: 0, overflow: "hidden", position: "relative" }}>
        <div data-parallax="0.84" style={{ position: "absolute", left: "0", right: "-905px", top: "0", bottom: "-322px", overflow: "hidden", transform: "translateY(var(--parallax, 0px))", willChange: "transform" }}>
          <div style={{ position: "absolute", left: "-157px", right: "799.85px", top: "calc(50% + -54.74px)", transform: "translateY(-50%)", aspectRatio: "2693 / 4096", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundImage: "url(/a/37c1e534ac6fc7faeccf8d80ac49543e307631e3.webp)" }} />
          <div style={{ position: "absolute", left: "0", right: "905px", top: "0", bottom: "335px", background: "rgba(24, 41, 52, 0.8)" }} />
        </div>
        <div style={{ position: "absolute", left: "0", right: "0", bottom: "0", height: "346px", backgroundImage: "linear-gradient(180deg, rgba(4, 13, 4, 0) 0%, #040d04 100%)" }} />
        <img
          src="/a/e495ae9e602b6fb70013c0d261cb43a23cd91748.svg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          style={{ position: "absolute", left: "calc(50% + -151px)", top: "calc(50% + -86.5px)", width: "302.87px", height: "137px" }}
        />
        <p style={{ position: "absolute", left: "40px", right: "40px", bottom: "80px", fontSize: "18px", lineHeight: "28px", fontWeight: 600, textAlign: "center", color: "#e2e8f0" }}>{`Разработка Логотипа для Хирурга Дмитрия Микулича — Айдентика, Брендинг`}</p>
      </div>
      </div>
      {/* Desktop */}
      <div className="figma-page hidden xl:block">
      <div style={{ alignSelf: "stretch", height: "824px", flexShrink: 0, overflow: "hidden", position: "relative" }}>
        <div data-parallax="0.84" style={{ position: "absolute", left: "0", right: "0", top: "0", bottom: "0", overflow: "hidden", transform: "translateY(var(--parallax, 0px))", willChange: "transform" }}>
          <div style={{ position: "absolute", left: "-165px", right: "-39px", top: "calc(50% + 103.25px)", transform: "translateY(-50%)", aspectRatio: "2693 / 4096", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundImage: "url(/a/37c1e534ac6fc7faeccf8d80ac49543e307631e3.webp)" }} />
          <div style={{ position: "absolute", left: "0", right: "0", top: "0", bottom: "0", background: "rgba(24, 41, 52, 0.8)" }} />
        </div>
        <div style={{ position: "absolute", left: "0%", right: "0%", bottom: "0", height: "568px", backgroundImage: "linear-gradient(180deg, rgba(4, 13, 4, 0) 0%, #040d04 100%)" }} />
        <img
          src="/a/7eb33213e5379fa0222974d724324980979006fe.svg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          style={{ position: "absolute", left: "calc(50% + -239px)", top: "calc(50% + -132px)", width: "478.39px", height: "229px" }}
        />
        <p style={{ position: "absolute", left: "calc(50% + 0px)", top: "calc(50% + 296px)", transform: "translateX(-50%) translateY(-50%)", fontSize: "24px", lineHeight: "32px", fontWeight: 600, textAlign: "center", color: "#ffffff", whiteSpace: "nowrap" }}>{`Разработка Логотипа для Хирурга Дмитрия Микулича — Айдентика, Брендинг`}</p>
      </div>
      </div>
    </>
  );
}
