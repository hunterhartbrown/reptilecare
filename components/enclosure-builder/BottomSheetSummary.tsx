import React, { useEffect } from 'react';

type BottomSheetSummaryProps = {
\tbuild: Record<string, unknown>;
\topen: boolean;
\tonOpenChange: (open: boolean) => void;
\tpeekHeight?: number;
\tmode?: 'sheet' | 'sidebar';
\tonReset: () => void;
};

export default function BottomSheetSummary({ build, open, onOpenChange, peekHeight = 64, mode = 'sheet', onReset }: BottomSheetSummaryProps) {
\tuseEffect(() => {
\t\t// Focus trap/lightweight accessibility when acting as dialog
\t\tif (mode === 'sheet' && open) {
\t\t\t// @ts-ignore
\t\t\tdocument.body.style.overflow = 'hidden';
\t\t\treturn () => { /* @ts-ignore */ document.body.style.overflow = ''; };
\t\t}
\t}, [open, mode]);

\tconst entries = Object.entries(build || {});

\tconst content = (
\t\t<div className="rounded-2xl border border-border/50 bg-white shadow-lg p-4 md:p-6">
\t\t\t<div className="flex items-center justify-between mb-3">
\t\t\t\t<h3 className="text-base font-semibold">Quick Summary</h3>
\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t<button onClick={onReset} className="text-sm px-3 py-1.5 rounded-lg border">Reset</button>
\t\t\t\t\t<button className="text-sm px-3 py-1.5 rounded-lg border">Copy Link</button>
\t\t\t\t</div>
\t\t\t</div>
\t\t\t<div className="flex flex-wrap gap-2">
\t\t\t\t{entries.length === 0 ? <span className="text-sm text-muted-foreground">No selections yet.</span> : null}
\t\t\t\t{entries.map(([field, value]) => (
\t\t\t\t\t<span key={field} className="text-xs px-2 py-1 rounded-full bg-black text-white">{field}: {String(value)}</span>
\t\t\t\t))}
\t\t\t</div>
\t\t</div>
\t);

\tif (mode === 'sidebar') return content;

\treturn (
\t\t<div role="dialog" aria-modal="true" aria-label="Quick Summary" className="fixed left-0 right-0 bottom-0 z-40">
\t\t\t{/* Peek handle */}
\t\t\t<button aria-label={open ? 'Collapse summary' : 'Expand summary'} onClick={() => onOpenChange(!open)} className="w-full">
\t\t\t\t<div className="mx-auto w-full max-w-[640px] px-4">
\t\t\t\t\t<div className="rounded-t-2xl border border-b-0 border-border/50 bg-white shadow-lg">
\t\t\t\t\t\t<div className="py-2 flex flex-col items-center">
\t\t\t\t\t\t\t<span className="h-1.5 w-10 rounded-full bg-gray-300" />
\t\t\t\t\t\t\t<span className="text-sm mt-2">Quick Summary</span>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</button>
\t\t\t<div className="mx-auto w-full max-w-[640px] px-4" style={{ height: open ? 'auto' : peekHeight }}>
\t\t\t\t{open ? content : null}
\t\t\t</div>
\t\t</div>
\t);
}


