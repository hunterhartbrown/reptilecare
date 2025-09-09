import React from 'react';
import { motion } from 'framer-motion';

type PreviewCardProps = {
\tbuild: Record<string, unknown>;
};

export default function PreviewCard({ build }: PreviewCardProps) {
\tconst length = Number(build['length'] ?? 36);
\tconst width = Number(build['width'] ?? 18);
\tconst height = Number(build['height'] ?? 18);
\tconst species = String(build['species'] ?? '');

\t// Simple proportional box preview
\tconst max = Math.max(length, width, height) || 1;
\tconst scale = 140 / max; // px per unit

\treturn (
\t\t<div className="rounded-2xl border border-border/50 bg-white shadow-md p-4">
\t\t\t<h3 className="text-base font-semibold mb-3">Live Preview</h3>
\t\t\t<div className="flex items-center gap-4">
\t\t\t\t<div className="flex-1">
\t\t\t\t\t<motion.div layout className="mx-auto aspect-[4/3] max-w-[280px] w-full grid place-items-center">
\t\t\t\t\t\t<div className="relative bg-gray-50 rounded-xl border border-dashed border-gray-300 w-full h-full grid place-items-center">
\t\t\t\t\t\t\t<motion.div layout className="relative" style={{ width: Math.max(length * scale, 40), height: Math.max(height * scale, 40) }}>
\t\t\t\t\t\t\t\t<div className="absolute inset-0 rounded-md bg-gradient-to-br from-gray-200 to-gray-100 shadow-inner" />
\t\t\t\t\t\t\t\t<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">{length}" × {width}" × {height}"</div>
\t\t\t\t\t\t\t</motion.div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</motion.div>
\t\t\t\t</div>
\t\t\t\t<div className="w-[120px] text-center">
\t\t\t\t\t<div className="w-20 h-20 rounded-full bg-gray-100 border border-border/50 mx-auto mb-2" aria-hidden />
\t\t\t\t\t<p className="text-xs text-muted-foreground">{species || 'Species image'}</p>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t);
}


