import { getBannerHighlightLabel } from "@/lib/banner-label";

type BannerImageWithHighlightProps = {
  src: string;
  alt: string;
  label?: string;
  venue?: string;
  eventName?: string;
  /** default = grid cards; medium = registration; large = event detail */
  size?: "default" | "medium" | "large";
  className?: string;
  imgClassName?: string;
};

export function BannerImageWithHighlight({
  src,
  alt,
  label,
  venue,
  eventName,
  size = "default",
  className = "",
  imgClassName = "",
}: BannerImageWithHighlightProps) {
  const highlightLabel = label ?? getBannerHighlightLabel(venue, eventName);
  const sizeClass =
    size === "large"
      ? "hf-banner-media--large"
      : size === "medium"
        ? "hf-banner-media--medium"
        : "";

  return (
    <div className={`hf-banner-media ${sizeClass} ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={`hf-banner-media__image ${imgClassName}`.trim()} />
      {highlightLabel ? (
        <div className="hf-banner-media__label-wrap" aria-hidden="true">
          <span className="hf-banner-media__label">{highlightLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
