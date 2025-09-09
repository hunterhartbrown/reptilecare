import React from 'react';

type Step = { id: string; label: string };

type StepperProps = {
\tsteps: Step[];
\tactiveIndex: number;
\tonStepClick: (index: number) => void;
};

export default function Stepper({ steps, activeIndex, onStepClick }: StepperProps) {
\treturn (
\t\t<div role="tablist" aria-label="Enclosure builder steps" className="flex items-center gap-2 overflow-x-auto no-scrollbar">
\t\t\t{steps.map((step, idx) => {
\t\t\t\tconst isActive = idx === activeIndex;
\t\t\t\treturn (
\t\t\t\t\t<button
\t\t\t\t\t\tkey={step.id}
\t\t\t\t\t\trole="tab"
\t\t\t\t\t\taria-selected={isActive}
\t\t\t\t\t\tonClick={() => onStepClick(idx)}
\t\t\t\t\t\tclassName={`px-3 py-2 rounded-xl border text-sm whitespace-nowrap ${isActive ? 'bg-black text-white border-black' : 'border-border/50 bg-white text-foreground'}`}
\t\t\t\t\t>
\t\t\t\t\t\t{step.label}
\t\t\t\t\t</button>
\t\t\t\t);
\t\t\t})}
\t\t</div>
\t);
}


