import React from 'react';

type SegmentedOption = { label: string; value: string };

type SegmentedControlProps = {
\tname: string;
\tvalue: string;
\tonChange: (value: string) => void;
\toptions: SegmentedOption[];
};

export default function SegmentedControl({ name, value, onChange, options }: SegmentedControlProps) {
\treturn (
\t\t<div role="radiogroup" aria-label={name} className="inline-flex rounded-xl border border-border/50 bg-white p-1">
\t\t\t{options.map(opt => {
\t\t\t\tconst active = value === opt.value;
\t\t\t\treturn (
\t\t\t\t\t<button key={opt.value} role="radio" aria-checked={active} className={`px-3 py-1.5 text-sm rounded-lg transition ${active ? 'bg-black text-white' : 'text-foreground'}`} onClick={() => onChange(opt.value)}>
\t\t\t\t\t\t{opt.label}
\t\t\t\t\t</button>
\t\t\t\t);
\t\t\t})}
\t\t</div>
\t);
}


