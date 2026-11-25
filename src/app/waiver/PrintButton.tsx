"use client";
export function PrintButton() {
  return <button onClick={() => print()} className="btn btn-primary text-sm">Print / Save as PDF</button>;
}
