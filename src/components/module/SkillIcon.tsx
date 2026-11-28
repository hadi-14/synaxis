/**
 * Small line icon for a "skills tested" chip, picked from the skill's wording (skills are free text in
 * admin), with a spark as the fallback. 20×20, inherits currentColor.
 */
const ICONS: [RegExp, React.ReactNode][] = [
  [/team/i, <><circle cx="7.5" cy="7" r="2.6" /><circle cx="13.5" cy="7.5" r="2.2" /><path d="M2.8 16c.6-2.7 2.5-4.2 4.7-4.2s4.1 1.5 4.7 4.2M11.6 12.1c.6-.3 1.2-.4 1.9-.4 1.9 0 3.4 1.3 3.9 3.6" /></>],
  [/observ|scan/i, <><path d="M1.8 10S5 4.5 10 4.5 18.2 10 18.2 10 15 15.5 10 15.5 1.8 10 1.8 10Z" /><circle cx="10" cy="10" r="2.6" /></>],
  [/evidence|lead|case|investig/i, <><circle cx="8.5" cy="8.5" r="5" /><path d="m12.3 12.3 5 5" /></>],
  [/motive|behaviour|behavior|mind|research/i, <><path d="M7 16.5v-2.3A5.5 5.5 0 1 1 15 9.5l1.4 2.6-1.6.4v1.8a1.6 1.6 0 0 1-1.6 1.6H11v.6" /><path d="M8.5 7.2a1.8 1.8 0 0 1 3.3 1c0 1.2-1.6 1.5-1.6 2.6" /></>],
  [/system|cause|network|sense/i, <><circle cx="4" cy="10" r="2" /><circle cx="16" cy="4.5" r="2" /><circle cx="16" cy="15.5" r="2" /><path d="m5.8 9.1 8.4-3.7M5.8 10.9l8.4 3.7" /></>],
  [/experiment|test|practical|lab/i, <><path d="M7.5 2.5h5M8.5 2.5v5L3.8 15.4A1.4 1.4 0 0 0 5 17.5h10a1.4 1.4 0 0 0 1.2-2.1L11.5 7.5v-5" /><path d="M5.6 12.5h8.8" /></>],
  [/molecul|predict|atom|chem/i, <><circle cx="10" cy="10" r="1.6" /><ellipse cx="10" cy="10" rx="8" ry="3.2" /><ellipse cx="10" cy="10" rx="8" ry="3.2" transform="rotate(60 10 10)" /><ellipse cx="10" cy="10" rx="8" ry="3.2" transform="rotate(120 10 10)" /></>],
  [/model|estimat|first-principles|physics|quantit/i, <><path d="M2.5 17.5h15M3.5 17.5V3" /><path d="m5.5 13.5 3.5-4 3 2.5 4.5-6" /></>],
  [/code|program|algorithm|debug|decompos|efficien/i, <><path d="m6.5 6-4 4 4 4M13.5 6l4 4-4 4M11.5 3.5l-3 13" /></>],
  [/engineer|design|electronic|build/i, <><circle cx="10" cy="10" r="2.6" /><path d="M10 2.5v2.2M10 15.3v2.2M2.5 10h2.2M15.3 10h2.2M4.7 4.7l1.6 1.6M13.7 13.7l1.6 1.6M4.7 15.3l1.6-1.6M13.7 6.3l1.6-1.6" /></>],
  [/proof|rigour|rigor|deduc|logic|fallac|argument|critical|reason|pattern/i, <><path d="M10 3.5 3.5 15.5h13Z" /><circle cx="10" cy="11.5" r="1" fill="currentColor" /></>],
  [/time|pressure|speed/i, <><circle cx="10" cy="11" r="6" /><path d="M10 7.5V11l2.3 1.6M8 2.5h4" /></>],
];
const SPARK = <path d="M10 2.5v4M10 13.5v4M2.5 10h4M13.5 10h4M5.2 5.2l2.2 2.2M12.6 12.6l2.2 2.2M5.2 14.8l2.2-2.2M12.6 7.4l2.2-2.2" />;

export function SkillIcon({ skill, className = "h-5 w-5" }: { skill: string; className?: string }) {
  const icon = ICONS.find(([re]) => re.test(skill))?.[1] ?? SPARK;
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {icon}
    </svg>
  );
}
