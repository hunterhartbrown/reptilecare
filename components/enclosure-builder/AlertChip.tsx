import React from 'react';

type AlertChipProps = {
\tvariant?: 'warning' | 'error' | 'info' | 'success';
\tchildren: React.ReactNode;
};

const styles: Record<string, string> = {
\twarning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
\terror: 'bg-red-50 text-red-800 border-red-200',
\tinfo: 'bg-blue-50 text-blue-800 border-blue-200',
\tsuccess: 'bg-green-50 text-green-800 border-green-200'
};

export default function AlertChip({ variant = 'info', children }: AlertChipProps) {
\treturn (
\t\t<span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${styles[variant]}`}>{children}</span>
\t);
}


