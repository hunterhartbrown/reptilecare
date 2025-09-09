import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StepLayout from './StepLayout';
import Stepper from './Stepper';
import OptionCard from './OptionCard';
import SegmentedControl from './SegmentedControl';
import BottomSheetSummary from './BottomSheetSummary';
import PreviewCard from './PreviewCard';
import InlineTip from './InlineTip';
import AlertChip from './AlertChip';

type BuildObject = Record<string, unknown>;

type EnclosureBuilderProps = {
\t// Keep the canonical build object shape from the legacy page. We treat it as opaque.
\tinitialBuild?: BuildObject;
\t// Forward analytics wrapper if present in site; fallback to window.rcAnalytics
\ttrack?: (eventName: string, payload?: Record<string, unknown>) => void;
};

const steps = [
\t{ id: 'species', label: 'Species' },
\t{ id: 'size', label: 'Size' },
\t{ id: 'heating', label: 'Heating' },
\t{ id: 'substrate', label: 'Substrate' }
];

// Minimal analytics passthrough
const useAnalytics = (externalTrack?: (e: string, p?: Record<string, unknown>) => void) => {
\tconst track = useCallback((eventName: string, payload?: Record<string, unknown>) => {
\t\ttry {
\t\t\texternalTrack?.(eventName, payload);
\t\t\t// @ts-ignore - runtime optional
\t\t\twindow.rcAnalytics?.track?.(eventName, payload);
\t\t} catch { /* no-op */ }
\t}, [externalTrack]);
\treturn track;
};

export default function EnclosureBuilder({ initialBuild, track: externalTrack }: EnclosureBuilderProps) {
\tconst track = useAnalytics(externalTrack);

\t// Canonical build object (unchanged shape; we store as an object and mutate fields 1:1)
\tconst [build, setBuild] = useState<BuildObject>(() => initialBuild ?? {});
\tconst [activeStep, setActiveStep] = useState<number>(0);
\tconst [summaryOpen, setSummaryOpen] = useState<boolean>(false);
\tconst [unit, setUnit] = useState<'in' | 'cm'>('in');

\tconst totalSteps = steps.length;
\tconst currentStep = steps[activeStep];

\t// Derived minimal cost (placeholder - rely on legacy logic sources when wired)
\tconst estimatedCost = useMemo(() => {
\t\t// TODO: Pull from existing cost calc when integrating
\t\treturn 0;
\t}, [build]);

\t// Debounced updates (200ms)
\tconst debounceRef = useRef<number | null>(null);
\tconst debouncedSetBuild = useCallback((updater: (prev: BuildObject) => BuildObject) => {
\t\tif (debounceRef.current) {
\t\t\twindow.clearTimeout(debounceRef.current);
\t\t}
\t\tdebounceRef.current = window.setTimeout(() => {
\t\t\tsetBuild(prev => updater(prev));
\t\t}, 200);
\t}, []);

\t// Public API for children to update values without changing the object shape
\tconst onChange = useCallback((field: string, value: unknown) => {
\t\tdebouncedSetBuild(prev => ({ ...prev, [field]: value }));
\t\ttrack('rc_enclosure_option_select', { step: currentStep.id, field, value });
\t}, [debouncedSetBuild, track, currentStep.id]);

\tconst onNext = useCallback(() => {
\t\tsetActiveStep(s => Math.min(s + 1, totalSteps - 1));
\t\ttrack('rc_enclosure_next_click', { step: currentStep.id });
\t}, [track, currentStep.id]);

\tconst onBack = useCallback(() => {
\t\tsetActiveStep(s => Math.max(s - 1, 0));
\t}, []);

\t// Analytics: step view
\tuseEffect(() => {
\t\ttrack('rc_enclosure_step_view', { step: currentStep.id });
\t}, [activeStep, track, currentStep.id]);

\t// Summary open/close analytics
\tconst handleSummaryToggle = useCallback((open: boolean) => {
\t\tsetSummaryOpen(open);
\t\ttrack(open ? 'rc_enclosure_summary_expand' : 'rc_enclosure_summary_collapse');
\t}, [track]);

\t// Desktop two-pane layout; mobile-first single column
\treturn (
\t\t<div className="enclosure-builder w-full mx-auto max-w-[1280px] px-4 sm:px-6 md:px-8">
\t\t\t{/* Tokens (fallback if site tokens absent) */}
\t\t\t<style>{`:root{--rc-radius:1rem;--rc-gap:1rem;--rc-shadow:0 8px 24px rgba(0,0,0,.08);}`}</style>

\t\t\t{/* Stepper */}
\t\t\t<div className="pt-4 md:pt-6">
\t\t\t\t<Stepper
\t\t\t\t\tsteps={steps}
\t\t\t\t\tactiveIndex={activeStep}
\t\t\t\t\tonStepClick={setActiveStep}
\t\t\t\t/>
\t\t\t</div>

\t\t\t<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 items-start mt-4 md:mt-6">
\t\t\t\t{/* Left: Step content */}
\t\t\t\t<div>
\t\t\t\t\t<AnimatePresence mode="wait">
\t\t\t\t\t\t<motion.div key={currentStep.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
\t\t\t\t\t\t\t<StepLayout
\t\t\t\t\t\t\t\ttitle={steps[activeStep].label}
\t\t\t\t\t\t\t\tsubtitle={getSubtitleForStep(currentStep.id)}
\t\t\t\t\t\t\t\tonNext={onNext}
\t\t\t\t\t\t\t\tonBack={onBack}
\t\t\t\t\t\t\t\tnextDisabled={false}
\t\t\t\t\t\t\t\tstepIndex={activeStep}
\t\t\t\t\t\t\t\ttotalSteps={totalSteps}
\t\t\t\t\t\t\t\testimatedCost={estimatedCost}
\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t{renderStepContent(currentStep.id, { build, onChange, unit, setUnit })}
\t\t\t\t\t\t\t</StepLayout>
\t\t\t\t\t\t</motion.div>
\t\t\t\t\t</AnimatePresence>
\t\t\t\t</div>

\t\t\t\t{/* Right: Sticky Summary + Preview (lg+) */}
\t\t\t\t<div className="hidden lg:block sticky top-24 space-y-4">
\t\t\t\t\t<PreviewCard build={build} />
\t\t\t\t\t<BottomSheetSummary
\t\t\t\t\t\tbuild={build}
\t\t\t\t\t\topen={true}
\t\t\t\t\t\tonOpenChange={handleSummaryToggle}
\t\t\t\t\t\tmode="sidebar"
\t\t\t\t\t\t// TODO: Wire Reset and Copy Link to legacy logic
\t\t\t\t\t\t// eslint-disable-next-line @typescript-eslint/no-empty-function
\t\t\t\t\t\tonReset={() => {}}
\t\t\t\t\t/>
\t\t\t\t</div>
\t\t\t</div>

\t\t\t{/* Mobile persistent summary bottom sheet */}
\t\t\t<div className="lg:hidden">
\t\t\t\t<BottomSheetSummary
\t\t\t\t\tbuild={build}
\t\t\t\t\topen={summaryOpen}
\t\t\t\t\tonOpenChange={handleSummaryToggle}
\t\t\t\t\tpeekHeight={64}
\t\t\t\t\t// eslint-disable-next-line @typescript-eslint/no-empty-function
\t\t\t\t\tonReset={() => {}}
\t\t\t\t/>
\t\t\t</div>
\t\t</div>
\t);
}

// Step content renderers
function renderStepContent(stepId: string, ctx: { build: BuildObject; onChange: (field: string, value: unknown) => void; unit: 'in' | 'cm'; setUnit: (u: 'in' | 'cm') => void; }) {
\tswitch (stepId) {
\t\tcase 'species':
\t\t\treturn (
\t\t\t\t<div className="space-y-4">
\t\t\t\t\t<p className="text-sm text-muted-foreground">Choose your reptile to tailor recommendations.</p>
\t\t\t\t\t<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
\t\t\t\t\t\t{/* TODO: Map from existing species list; preserve IDs */}
\t\t\t\t\t\t<OptionCard name="species" value="leopard-gecko" checked={ctx.build['species']==='leopard-gecko'} onChange={() => ctx.onChange('species', 'leopard-gecko')} label="Leopard Gecko" />
\t\t\t\t\t\t<OptionCard name="species" value="bearded-dragon" checked={ctx.build['species']==='bearded-dragon'} onChange={() => ctx.onChange('species', 'bearded-dragon')} label="Bearded Dragon" />
\t\t\t\t\t\t<OptionCard name="species" value="crested-gecko" checked={ctx.build['species']==='crested-gecko'} onChange={() => ctx.onChange('species', 'crested-gecko')} label="Crested Gecko" />
\t\t\t\t\t</div>
\t\t\t\t\t<InlineTip title="Why this matters">Different species have unique size, temperature, and humidity needs.</InlineTip>
\t\t\t\t</div>
\t\t\t);
\t\tcase 'size':
\t\t\treturn (
\t\t\t\t<div className="space-y-4">
\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t<span className="text-sm">Units</span>
\t\t\t\t\t\t<SegmentedControl
\t\t\t\t\t\t\tname="units"
\t\t\t\t\t\t\tvalue={ctx.unit}
\t\t\t\t\t\t\tonChange={(v) => ctx.setUnit(v as 'in' | 'cm')}
\t\t\t\t\t\t\toptions={[{ label: 'in', value: 'in' }, { label: 'cm', value: 'cm' }]}
\t\t\t\t\t\t/>
\t\t\t\t\t</div>
\t\t\t\t\t<div className="grid grid-cols-3 gap-3">
\t\t\t\t\t\t{/* Keep name/ids for legacy hooks */}
\t\t\t\t\t\t<label className="block">
\t\t\t\t\t\t\t<span className="text-xs text-foreground">Length</span>
\t\t\t\t\t\t\t<input aria-label="Length" name="length" className="mt-1 w-full rounded-2xl border border-border/50 bg-background px-3 py-2" inputMode="numeric" placeholder={ctx.unit==='in'?'36 in':'91 cm'} onChange={(e) => ctx.onChange('length', e.target.value)} />
\t\t\t\t\t\t</label>
\t\t\t\t\t\t<label className="block">
\t\t\t\t\t\t\t<span className="text-xs text-foreground">Width</span>
\t\t\t\t\t\t\t<input aria-label="Width" name="width" className="mt-1 w-full rounded-2xl border border-border/50 bg-background px-3 py-2" inputMode="numeric" placeholder={ctx.unit==='in'?'18 in':'46 cm'} onChange={(e) => ctx.onChange('width', e.target.value)} />
\t\t\t\t\t\t</label>
\t\t\t\t\t\t<label className="block">
\t\t\t\t\t\t\t<span className="text-xs text-foreground">Height</span>
\t\t\t\t\t\t\t<input aria-label="Height" name="height" className="mt-1 w-full rounded-2xl border border-border/50 bg-background px-3 py-2" inputMode="numeric" placeholder={ctx.unit==='in'?'18 in':'46 cm'} onChange={(e) => ctx.onChange('height', e.target.value)} />
\t\t\t\t\t\t</label>
\t\t\t\t\t</div>
\t\t\t\t\t<InlineTip title="Tip">Bigger enclosures provide better welfare and enrichment.</InlineTip>
\t\t\t\t</div>
\t\t\t);
\t\tcase 'heating':
\t\t\treturn (
\t\t\t\t<div className="space-y-4">
\t\t\t\t\t<p className="text-sm text-muted-foreground">Choose heating and lighting.</p>
\t\t\t\t\t<div className="grid grid-cols-2 gap-3">
\t\t\t\t\t\t<OptionCard name="heating" value="uvb-10.0" checked={ctx.build['heating']==='uvb-10.0'} onChange={() => ctx.onChange('heating', 'uvb-10.0')} label="UVB 10.0" description="High output" />
\t\t\t\t\t\t<OptionCard name="heating" value="uvb-5.0" checked={ctx.build['heating']==='uvb-5.0'} onChange={() => ctx.onChange('heating', 'uvb-5.0')} label="UVB 5.0" />
\t\t\t\t\t</div>
\t\t\t\t\t<InlineTip title="Why this matters">Proper UVB and heat gradients are essential for metabolism.</InlineTip>
\t\t\t\t</div>
\t\t\t);
\t\tcase 'substrate':
\t\t\treturn (
\t\t\t\t<div className="space-y-4">
\t\t\t\t\t<p className="text-sm text-muted-foreground">Pick substrate and decor.</p>
\t\t\t\t\t<div className="grid grid-cols-2 gap-3">
\t\t\t\t\t\t<OptionCard name="substrate" value="paper-towel" checked={ctx.build['substrate']==='paper-towel'} onChange={() => ctx.onChange('substrate', 'paper-towel')} label="Paper towel" />
\t\t\t\t\t\t<OptionCard name="substrate" value="bioactive" checked={ctx.build['substrate']==='bioactive'} onChange={() => ctx.onChange('substrate', 'bioactive')} label="Bioactive" />
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t);
\t\tdefault:
\t\t\treturn null;
\t}
}

function getSubtitleForStep(stepId: string): string {
\tswitch (stepId) {
\t\tcase 'species':
\t\t\treturn 'Tailor the build to your reptile.';
\t\tcase 'size':
\t\t\treturn 'Set enclosure dimensions.';
\t\tcase 'heating':
\t\t\treturn 'Choose heating and lighting.';
\t\tcase 'substrate':
\t\t\treturn 'Select substrate and decor.';
\t\tdefault:
\t\t\treturn '';
\t}
}


