/** Inline above-fold PDP styles — paint before full Tailwind stylesheet. */
export const PRODUCT_CRITICAL_CSS = `
.pdp-page{--background:#fff;--foreground:#1a2428;--card:#fff;--primary:#0b3d4a;--muted-foreground:#5a656b;--border:#d8dde0;--ink:#0b3d4a;--cta:#b85c38;--stone:#f3f2ef;color:var(--foreground);background:var(--background)}
.pdp-page .font-display{font-family:Newsreader,ui-serif,Georgia,serif;font-weight:600;letter-spacing:-.01em}
.pdp-page .aspect-square{aspect-ratio:1/1}
.pdp-page .object-contain{object-fit:contain}
.pdp-page .p-4{padding:1rem}
.pdp-page .mx-auto{margin-inline:auto}
.pdp-page .max-w-7xl{max-width:80rem}
.pdp-page .w-full{width:100%}
.pdp-page .relative{position:relative}
.pdp-page .overflow-hidden{overflow:hidden}
.pdp-page .rounded-\\[10px\\]{border-radius:10px}
.pdp-page .border{border:1px solid var(--border)}
.pdp-page .bg-card{background:var(--card)}
.pdp-page .grid{display:grid}
.pdp-page .gap-10{gap:2.5rem}
.pdp-page .flex{display:flex}
.pdp-page .flex-col{flex-direction:column}
.pdp-page .order-1{order:1}
.pdp-page .order-2{order:2}
.pdp-page .mb-6{margin-bottom:1.5rem}
.pdp-page .text-sm{font-size:.875rem;line-height:1.25rem}
.pdp-page .text-4xl{font-size:2.25rem;line-height:1.05}
.pdp-page .text-5xl{font-size:3rem;line-height:1}
.pdp-page .text-primary{color:var(--primary)}
.pdp-page .text-foreground{color:var(--foreground)}
.pdp-page .text-muted-foreground{color:var(--muted-foreground)}
.pdp-page .mt-2{margin-top:.5rem}
.pdp-page .mt-6{margin-top:1.5rem}
.pdp-page .leading-\\[1\\.05\\]{line-height:1.05}
.pdp-page .tracking-tight{letter-spacing:-.025em}
.pdp-page .pt-6{padding-top:1.5rem}
@media(min-width:768px){.pdp-page .md\\:order-1{order:1}.pdp-page .md\\:order-2{order:2}.pdp-page .md\\:grid-cols-\\[1\\.05fr_1fr\\]{grid-template-columns:1.05fr 1fr}.pdp-page .md\\:gap-14{gap:3.5rem}.pdp-page .md\\:text-5xl{font-size:3rem;line-height:1}.pdp-page .md\\:pt-10{padding-top:2.5rem}}
`;
