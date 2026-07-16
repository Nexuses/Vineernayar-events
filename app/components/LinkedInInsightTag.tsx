import Script from "next/script";

const LINKEDIN_PARTNER_ID =
  process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID?.trim() || "9627468";

type LinkedInInsightTagProps = {
  idSuffix?: string;
};

export function LinkedInInsightTag({ idSuffix = "" }: LinkedInInsightTagProps) {
  return (
    <>
      <Script
        id={`linkedin-partner${idSuffix}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var pid = "${LINKEDIN_PARTNER_ID}";
              window._linkedin_partner_id = window._linkedin_partner_id || pid;
              window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
              if (window._linkedin_data_partner_ids.indexOf(pid) === -1) {
                window._linkedin_data_partner_ids.push(pid);
              }
              window.lintrk = window.lintrk || function (a, b) { window.lintrk.q.push([a, b]); };
              window.lintrk.q = window.lintrk.q || [];
            })();
          `,
        }}
      />
      <Script
        id={`linkedin-insight${idSuffix}`}
        src="https://snap.licdn.com/li.lms-analytics/insight.min.js"
        strategy="afterInteractive"
      />
      <noscript>
        <img
          height={1}
          width={1}
          style={{ display: "none" }}
          alt=""
          src={`https://px.ads.linkedin.com/collect/?pid=${LINKEDIN_PARTNER_ID}&fmt=gif`}
        />
      </noscript>
    </>
  );
}
