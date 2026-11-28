import type { Metadata } from "next";
import { getSettings } from "@/lib/content";
import { formatDateRange } from "@/lib/dates";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Waiver of liability", robots: { index: false } };

/** Printable waiver template. ⚑ Placeholder legal text: organisers should replace or upload an official PDF in admin settings. */
export default async function WaiverPage() {
  const s = await getSettings();
  return (
    <main className="mx-auto max-w-[720px] bg-white px-8 py-10 text-[#111] print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-[#555]">Print this page or save it as a PDF, sign it, then upload it on your dashboard.</p>
        <PrintButton />
      </div>
      <h1 className="text-2xl font-bold">Synaxis {s.season_label}: Waiver of Liability and Consent</h1>
      <p className="mt-1 text-sm">Heuser Science Society · {formatDateRange(s.event_start, s.event_end)} · {s.venue_name}, {s.venue_address}</p>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-[14px] leading-6">
        <li>I confirm that the participant named below is currently in school (Grade 9 to A-Level/Intermediate or equivalent) or a recent school graduate on a gap year, and is not enrolled in a university.</li>
        <li>I understand that Synaxis involves practical activities (including laboratory, robotics and outdoor or campus-wide activities) and that participants must follow all safety instructions given by organisers and staff.</li>
        <li>I release the Heuser Science Society, Heuser College, and their organisers, staff and volunteers from liability for loss, damage or injury arising from participation, except where caused by their negligence.</li>
        <li>I consent to the participant receiving basic first aid and, in an emergency, to the organisers seeking medical assistance on my behalf.</li>
        <li>I consent to photographs and video of the participant taken during the event being used by the Heuser Science Society for reporting and promotion.</li>
        <li>I agree that the participant will follow the code of conduct and the campus gate policy; leaving early requires the authorisation of a chaperone or guardian.</li>
      </ol>
      <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-8 text-[14px]">
        {["Participant full name", "Team name / registration ID", "Participant signature", "Date", "Parent/guardian name (if under 18)", "Parent/guardian signature", "Guardian phone", "Relationship to participant"].map((l) => (
          <div key={l}>
            <div className="h-8 border-b border-[#111]" />
            <p className="mt-1 text-[12px] text-[#555]">{l}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 text-[11px] text-[#777]">Template provided for convenience. The organisers&apos; official waiver, if issued, takes precedence.</p>
    </main>
  );
}
