import React from 'react';

type OptionCardProps = {
\tname: string;
\tvalue: string;
\tchecked: boolean;
\tonChange: (value: string) => void;
\tlabel?: string;
\tdescription?: string;
\tdisabled?: boolean;
\ticon?: React.ReactNode;
};

export default function OptionCard({ name, value, checked, onChange, label, description, disabled, icon }: OptionCardProps) {
\treturn (
\t\t<label className={`group relative rounded-2xl border p-3 shadow-sm cursor-pointer focus-within:ring-2 focus-within:ring-black transition ${checked ? 'border-black bg-white shadow-md' : 'border-border/50 bg-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
\t\t\t<input
\t\t\t\ttype="radio"
\t\t\t\tname={name}
\t\t\t\tvalue={value}
\t\t\t\tchecked={checked}
\t\t\t\tonChange={() => onChange(value)}
\t\t\t\tclassName="sr-only"
\t\t\t\trole="radio"
\t\t\t\taria-checked={checked}
\t\t\t\tdisabled={disabled}
\t\t\t/>
\t\t\t<div className="flex items-start gap-3">
\t\t\t\t{icon ? <div className="text-xl" aria-hidden>{icon}</div> : null}
\t\t\t\t<div className="flex-1">
\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t<span className="text-sm font-medium">{label ?? value}</span>
\t\t\t\t\t\t{checked ? <span className="text-xs rounded-full bg-black text-white px-2 py-0.5">Selected</span> : null}
\t\t\t\t\t</div>
\t\t\t\t\t{description ? <p className="text-xs text-muted-foreground mt-1">{description}</p> : null}
\t\t\t\t</div>
\t\t\t</div>
\t\t</label>
\t);
}


