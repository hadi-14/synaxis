import type { Faq, Settings } from "@/lib/types";
import { INSTAGRAM, SITE_URL } from "@/lib/seo";
import { earlyBirdOffer } from "@/lib/fees";
import { FEES_TOKEN, feesSentence } from "@/lib/fee-copy";

/** Safe JSON-LD script: escapes "<" so database text can never close the script tag. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Parent brand. The logo is the black wordmark (Google shows logos on light backgrounds). */
const HEUSER_COLLEGE = {
  "@type": "CollegeOrUniversity",
  "@id": `${SITE_URL}/#heuser-college`,
  name: "Heuser College",
  logo: `${SITE_URL}/brand/heuser/heuser-college-black.png`,
  address: { "@type": "PostalAddress", addressLocality: "Karachi", addressCountry: "PK" },
};

/** Organizer: Heuser Science Society, part of Heuser College. */
const ORG = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Heuser Science Society",
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512.png`,
  sameAs: [INSTAGRAM],
  parentOrganization: { "@id": `${SITE_URL}/#heuser-college` },
};

/** Site name in Google results ("Synaxis" instead of the domain). url must be the home page with its trailing slash. */
const WEBSITE = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Synaxis",
  alternateName: ["Heuser Synaxis", "Synaxis 2027"],
  url: `${SITE_URL}/`,
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export function homeJsonLd(s: Settings, faqs: Faq[]) {
  // Offers are quoted for the smallest team; the early-bird offer is only valid until the deadline.
  const ex = earlyBirdOffer(s, s.team_min);
  const availability = s.registration_open ? "https://schema.org/InStock" : "https://schema.org/SoldOut";
  const regularOffer = {
    "@type": "Offer",
    name: `Team registration (team of ${s.team_min}), regular price`,
    price: ex.regular,
    priceCurrency: "PKR",
    availability,
    validFrom: s.registration_opens_at,
    priceValidUntil: s.registration_closes_at.slice(0, 10),
    url: `${SITE_URL}/register`,
  };
  const earlyOffer = {
    "@type": "Offer",
    name: `Team registration (team of ${s.team_min}), early bird`,
    price: ex.early,
    priceCurrency: "PKR",
    availability,
    validFrom: s.registration_opens_at,
    validThrough: s.early_bird_deadline,
    priceValidUntil: s.early_bird_deadline.slice(0, 10),
    url: `${SITE_URL}/register`,
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      WEBSITE,
      ORG,
      HEUSER_COLLEGE,
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
          name: "Heuser College",
          address: {
            "@type": "PostalAddress",
            // street address comes from admin settings; omitted while it is still the generic "Karachi, Pakistan"
            ...(s.venue_address && !/^karachi(,\s*pakistan)?$/i.test(s.venue_address.trim()) ? { streetAddress: s.venue_address } : {}),
            addressLocality: "Karachi",
            addressCountry: "PK",
          },
        },
        image: [`${SITE_URL}/opengraph-image`],
        organizer: { "@id": `${SITE_URL}/#organization` },
        offers: ex.saving > 0 ? [regularOffer, earlyOffer] : [regularOffer],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer.replace(FEES_TOKEN, feesSentence(s, "on")) } })),
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
