import { MARKETING_SITE_URL } from "@/lib/marketing-site";

const FAQ_BANNER = {
  background: "#F2F2F2",
  border: "#D1D1D1",
  text: "#5E6267",
} as const;

function FaqHelpIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.5" stroke={FAQ_BANNER.text} strokeWidth={2.5} />
      <path
        d="M9.5 9.5a3 3 0 015.3 1.2c0 2-2.5 2.2-2.5 3.8"
        stroke={FAQ_BANNER.text}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1" fill={FAQ_BANNER.text} />
    </svg>
  );
}

export function RegistrationFaqBanner() {
  return (
    <div
      className="flex items-center justify-center gap-2 rounded-[8px] px-4 py-3.5 text-center text-[14px] font-bold leading-none"
      style={{
        backgroundColor: FAQ_BANNER.background,
        border: `1px solid ${FAQ_BANNER.border}`,
        color: FAQ_BANNER.text,
      }}
    >
      <FaqHelpIcon />
      <p className="font-bold">
        Have questions?{" "}
        <a
          href={`${MARKETING_SITE_URL}/faq`}
          className="cursor-pointer font-bold underline decoration-solid underline-offset-[2px] hover:no-underline"
          style={{ color: FAQ_BANNER.text }}
        >
          Read our FAQs
        </a>
        .
      </p>
    </div>
  );
}
