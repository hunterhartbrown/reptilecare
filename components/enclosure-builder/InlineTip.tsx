import React, { useState } from 'react';

type InlineTipProps = {
\ttitle: string;
\tchildren: React.ReactNode;
};

export default function InlineTip({ title, children }: InlineTipProps) {
\tconst [open, setOpen] = useState(false);
\treturn (
\t\t<div className="inline-flex items-center gap-2">
\t\t\t<button aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(o => !o)} className="text-sm px-2 py-1 rounded-lg border">i</button>
\t\t\t{open ? (
\t\t\t\t<div role="dialog" className="z-20 max-w-[260px] rounded-xl border border-border/50 bg-white p-3 shadow-lg">
\t\t\t\t\t<p className="text-sm font-medium mb-1">{title}</p>
\t\t\t\t\t<div className="text-xs text-muted-foreground">{children}</div>
\t\t\t\t</div>
\t\t\t) : null}
\t\t</div>
\t);
}


