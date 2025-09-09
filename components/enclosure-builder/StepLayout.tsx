import React from 'react';

type StepLayoutProps = {
\ttitle: string;
\tsubtitle?: string;
\tchildren: React.ReactNode;
\tonNext: () => void;
\tonBack: () => void;
\tnextDisabled?: boolean;
\tstepIndex: number;
\ttotalSteps: number;
\testimatedCost?: number;
};

export default function StepLayout({ title, subtitle, children, onNext, onBack, nextDisabled, stepIndex, totalSteps, estimatedCost }: StepLayoutProps) {
\treturn (
\t\t<div className="rounded-2xl border border-border/50 bg-white shadow-md p-4 md:p-6">
\t\t\t<header className="mb-3">
\t\t\t\t<h2 className="text-lg md:text-xl font-semibold leading-tight">{title}</h2>
\t\t\t\t{subtitle ? <p className="text-sm text-muted-foreground mt-1">{subtitle}</p> : null}
\t\t\t</header>

\t\t\t<div className="min-h-[220px]">{children}</div>

\t\t\t{/* Sticky bottom bar */}
\t\t\t<div className="sticky bottom-0 left-0 right-0 mt-4 -mx-4 md:-mx-6">
\t\t\t\t<div className="flex items-center gap-3 border-t border-border/50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 md:px-6 py-3 rounded-b-2xl shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
\t\t\t\t\t<button aria-label="Back" onClick={onBack} className="px-3 py-2 rounded-xl border border-border/50 text-sm">Back</button>
\t\t\t\t\t<div className="ml-auto flex items-center gap-3 text-sm">
\t\t\t\t\t\t<span aria-live="polite">Step {stepIndex + 1}/{totalSteps}</span>
\t\t\t\t\t\t{typeof estimatedCost === 'number' ? <span className="text-muted-foreground">Est. ${estimatedCost.toFixed(2)}</span> : null}
\t\t\t\t\t\t<button aria-label="Next" onClick={onNext} disabled={!!nextDisabled} className="px-4 py-2 rounded-xl bg-black text-white text-sm disabled:opacity-50">{stepIndex + 1 === totalSteps ? 'Add to Summary' : 'Next'}</button>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t);
}


