import Image from "next/image";

export default function Hero() {
  return (
    <section className="px-5 pt-10 pb-10 md:px-10 md:pt-14 md:pb-14 xl:px-14 xl:pt-30 xl:pb-30">
      {/* Ширина блока зафиксирована, чтобы перенос строки в заголовке совпадал с оригиналом */}
      <div className="relative mx-auto w-full max-w-[350px] md:max-w-[720px] xl:max-w-[898px] xl:pb-4">
        <p className="text-muted text-[17px] leading-[normal] md:text-[28px] md:leading-9 xl:text-[36px] xl:leading-10">
          {/* На узких экранах в оригинале текст короче */}
          <span className="hidden md:inline">Привет, я</span>
          <span className="md:hidden">Я</span> Иван Григоренко — UX/UI дизайнер
        </p>

        <h1 className="text-ink mt-2 text-[20px] leading-[normal] font-bold md:mt-3 md:text-[35px] md:leading-10 xl:mt-5 xl:text-[48px] xl:leading-12">
          Создаю понятные, эстетичные и продуманные{" "}
          <span className="text-accent">цифровые</span> продукты
        </h1>

        {/* Курсор-стрелка — декоративный элемент поверх заголовка, только на desktop */}
        <Image
          src="/img/cursor-arrow.svg"
          alt=""
          aria-hidden="true"
          width={47}
          height={54}
          className="pointer-events-none absolute hidden xl:block"
          style={{ left: 611, top: 140 }}
        />
      </div>
    </section>
  );
}
