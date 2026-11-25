import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout, button, mono, p } from "./Layout";
import { formatRs, type FeeBreakdown } from "../fees";
import type { PaymentDetails } from "../types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function FeeTable({ fee }: { fee: FeeBreakdown }) {
  const row = (k: string, v: string, bold = false) => (
    <tr>
      <td style={{ padding: "6px 0", fontSize: 14, color: "#5F5F63" }}>{k}</td>
      <td style={{ ...mono, padding: "6px 0", textAlign: "right", fontWeight: bold ? 800 : 500 }}>{v}</td>
    </tr>
  );
  return (
    <table width="100%" style={{ borderCollapse: "collapse", margin: "8px 0 16px" }}>
      <tbody>
        {row("Delegation fee", formatRs(fee.delegationFee))}
        {row(`${fee.members} delegates × ${formatRs(fee.perDelegate)} (${fee.tier === "early" ? "early bird" : "regular"})`, formatRs(fee.delegatesTotal))}
        {row("Total", formatRs(fee.total), true)}
      </tbody>
    </table>
  );
}

export function RegistrationReceived(props: {
  teamName: string;
  regCode: string;
  fee: FeeBreakdown;
  bank: PaymentDetails;
  paymentDeadline: string;
}) {
  return (
    <EmailLayout preview={`${props.regCode}: registration received. Next, payment.`} heading="Registration received">
      <Text style={p}>Hello. Your team <strong>{props.teamName}</strong> is registered. Your registration ID is:</Text>
      <Text style={{ ...mono, fontSize: 22, fontWeight: 800, color: "#C42634" }}>{props.regCode}</Text>
      <FeeTable fee={props.fee} />
      <Text style={p}><strong>Pay by {props.paymentDeadline}</strong> to:</Text>
      <Section style={{ background: "#F7F5F0", borderRadius: 12, padding: "12px 16px" }}>
        <Text style={{ ...p, margin: 0 }}>
          {props.bank.bank_name}<br />
          Account title: {props.bank.account_title}<br />
          Account no: <span style={mono}>{props.bank.account_number}</span><br />
          IBAN: <span style={mono}>{props.bank.iban}</span><br />
          Reference: <span style={mono}>{props.regCode}</span>
        </Text>
      </Section>
      <Text style={{ ...p, marginTop: 16 }}>Then upload the receipt on your dashboard, or send it to us on WhatsApp.</Text>
      <Button href={`${SITE}/dashboard`} style={button}>Upload receipt</Button>
    </EmailLayout>
  );
}

export function ReceiptReceived({ teamName, regCode }: { teamName: string; regCode: string }) {
  return (
    <EmailLayout preview={`${regCode}: receipt received`} heading="Receipt received">
      <Text style={p}>We have the payment receipt for <strong>{teamName}</strong> ({regCode}). The finance team will review it shortly.</Text>
      <Text style={p}>Meanwhile, start collecting signed waivers for every member. The template is on your dashboard.</Text>
      <Button href={`${SITE}/dashboard`} style={button}>Open dashboard</Button>
    </EmailLayout>
  );
}

export function PaymentVerified({ teamName, regCode, waiversDone }: { teamName: string; regCode: string; waiversDone: boolean }) {
  return (
    <EmailLayout preview={`${regCode}: payment verified`} heading="I am satisfied with my care.">
      <Text style={p}>Payment for <strong>{teamName}</strong> ({regCode}) is verified. Ba-la-la-la-la! 👊</Text>
      <Text style={p}>
        {waiversDone
          ? "Your waivers are in too. Module allocations will be announced on your dashboard."
          : "Next: upload signed waivers for every member on your dashboard. Modules are allocated once the waivers are in."}
      </Text>
      <Button href={`${SITE}/dashboard`} style={button}>Open dashboard</Button>
    </EmailLayout>
  );
}

export function PaymentRejected({ teamName, regCode, reason, reupload }: { teamName: string; regCode: string; reason: string; reupload: boolean }) {
  return (
    <EmailLayout preview={`${regCode}: ${reupload ? "please re-upload your receipt" : "payment could not be verified"}`} heading={reupload ? "Please re-upload your receipt" : "Payment could not be verified"}>
      <Text style={p}>We reviewed the payment for <strong>{teamName}</strong> ({regCode}).</Text>
      <Section style={{ background: "#FDECEE", borderRadius: 12, padding: "12px 16px" }}>
        <Text style={{ ...p, margin: 0 }}><strong>Reason:</strong> {reason}</Text>
      </Section>
      <Text style={{ ...p, marginTop: 16 }}>
        {reupload ? "Upload a clearer or correct receipt from your dashboard." : "Reply to this email or message us on WhatsApp if you think this is a mistake."}
      </Text>
      <Button href={`${SITE}/dashboard`} style={button}>Open dashboard</Button>
    </EmailLayout>
  );
}

export function WaiversReceived({ teamName, regCode }: { teamName: string; regCode: string }) {
  return (
    <EmailLayout preview={`${regCode}: waivers complete`} heading="Waivers complete">
      <Text style={p}>All waivers for <strong>{teamName}</strong> ({regCode}) are marked as received. You&apos;re one step from your modules.</Text>
    </EmailLayout>
  );
}

export function ModulesAllocated({ teamName, regCode, modules }: { teamName: string; regCode: string; modules: string[] }) {
  return (
    <EmailLayout preview={`${regCode}: your modules are in`} heading="Your modules are allocated">
      <Text style={p}><strong>{teamName}</strong> ({regCode}) will compete in:</Text>
      <ul>{modules.map((m) => <li key={m} style={{ ...p, margin: "0 0 4px" }}>{m}</li>)}</ul>
      <Text style={p}>Your dashboard now shows your schedule and the check-in QR code for event day.</Text>
      <Button href={`${SITE}/dashboard`} style={button}>See schedule & QR</Button>
    </EmailLayout>
  );
}

export function SponsorInquiry(props: { name: string; organisation: string; email: string; phone?: string; interest?: string; message: string }) {
  return (
    <EmailLayout preview={`Sponsor inquiry from ${props.organisation}`} heading="New sponsor inquiry">
      <Text style={p}>
        <strong>{props.name}</strong> · {props.organisation}<br />
        <Link href={`mailto:${props.email}`}>{props.email}</Link> {props.phone ? `· ${props.phone}` : ""}<br />
        Interest: {props.interest || "—"}
      </Text>
      <Text style={{ ...p, whiteSpace: "pre-wrap" }}>{props.message}</Text>
    </EmailLayout>
  );
}

export function Broadcast({ heading, body }: { heading: string; body: string }) {
  return (
    <EmailLayout preview={heading} heading={heading}>
      {body.split(/\n{2,}/).map((para, i) => (
        <Text key={i} style={{ ...p, whiteSpace: "pre-wrap" }}>{para}</Text>
      ))}
      <Button href={`${SITE}/dashboard`} style={button}>Open dashboard</Button>
    </EmailLayout>
  );
}
