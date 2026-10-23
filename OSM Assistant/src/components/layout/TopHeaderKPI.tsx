import { ShieldCheck, Zap, Clock3, CheckCircle2 } from 'lucide-react';

// These are verifiable demo capabilities, not unmeasured performance claims.
const metrics = [
  { label: 'Sample scripts', value: '3', sub: 'seeded demo records', icon: CheckCircle2, tone: 'bg-sage-50 text-sage-600' },
  { label: 'Glitch categories', value: '4', sub: 'Upload · Timeout · Display · Login', icon: ShieldCheck, tone: 'bg-sand-50 text-sand-600' },
  { label: 'OCR safety gate', value: '< 75%', sub: 'manual read; no AI score', icon: Clock3, tone: 'bg-mist-50 text-mist-700' },
  { label: 'Final authority', value: 'Human', sub: 'AI never edits official marks', icon: Zap, tone: 'bg-brand-50 text-brand-600' }
];

export default function TopHeaderKPI() {
  return <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">{metrics.map(m => <div key={m.label} className="panel flex items-center gap-3 p-3"><div className={`shrink-0 rounded-xl p-2 ${m.tone}`}><m.icon size={18}/></div><div className="min-w-0"><div className="truncate text-xs text-mute">{m.label}</div><div className="text-base font-bold text-ink sm:text-lg">{m.value}</div><div className="line-clamp-2 text-[11px] leading-snug text-faint">{m.sub}</div></div></div>)}</div>;
}
