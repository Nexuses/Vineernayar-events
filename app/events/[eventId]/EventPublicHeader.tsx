import Link from "next/link";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/lib/constants";

export function EventPublicHeader() {
  return (
    <header className="flex justify-center border-b border-zinc-200 bg-white px-4 py-2 sm:py-2.5">
      <Link
        href="/"
        className="block rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_LOGO_URL}
          alt={BRAND_NAME}
          className="h-[52px] w-auto max-w-[300px] object-contain sm:h-[60px] sm:max-w-[360px]"
        />
      </Link>
    </header>
  );
}
