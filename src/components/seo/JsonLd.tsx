import type { Faq, Settings } from "@/lib/types";
import { INSTAGRAM, SITE_URL } from "@/lib/seo";

/** Safe JSON-LD script: escapes "<" so database text can never close the script tag. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

const ORG = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Heuser Science Society",
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512.png`,
  sameAs: [INSTAGRAM],
};

export function homeJsonLd(s: Settings, faqs: Faq[]) {
  const low = s.delegation_fee_early + s.team_min * s.early_fee;
  const high = s.delegation_fee_regular + s.team_max * s.regular_fee;
  return {
    "@context": "https://schema.org",
    "@graph": [
      ORG,
      {
        "@type": "Event",
        "@id": `${SITE_URL}/#event`,
        name: "Synaxis 2027: Heuser Science Olympiad",
        description:
          "A 3-day science olympiad for school teams: 9 modules across biology, chemistry, physics, computer science, robotics, mathematics, psychology, logic and criminology.",
        startDate: `${s.event_start}T09:00:00+05:00`,
        endDate: `${s.event_end}T17:00:00+05:00`,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: s.venue_name,
          address: { "@type": "PostalAddress", streetAddress: s.venue_address, addressLocality: "Karachi", addressCountry: "PK" },
        },
        image: [`${SITE_URL}/opengraph-image`],
        organizer: { "@id": `${SITE_URL}/#organization` },
        offers: {
          "@type": "AggregateOffer",
          name: "Team registration",
          priceCurrency: "PKR",
          lowPrice: Math.min(low, high),
          highPrice: Math.max(low, high),
          availability: s.registration_open ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          validFrom: s.registration_opens_at,
          url: `${SITE_URL}/register`,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
      },
    ],
  };
}

export function moduleBreadcrumbJsonLd(name: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Synaxis", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Modules", item: `${SITE_URL}/#modules` },
      { "@type": "ListItem", position: 3, name, item: `${SITE_URL}/modules/${slug}` },
    ],
  };
}
