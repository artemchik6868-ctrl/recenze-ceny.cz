/** GA4 — loads only when VITE_GA4_ID is set at build time.
 *  Use a CZ-only GA4 property (do not reuse sibling-market measurement IDs).
 *  Deferred until window load + idle so it stays off the critical path (PDP LCP). */
const GA4_ID = import.meta.env.VITE_GA4_ID as string | undefined;

export function Ga4Script() {
  if (!GA4_ID?.trim()) return null;
  const id = JSON.stringify(GA4_ID.trim());
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var id=${id};function load(){window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag("js",new Date());gtag("config",id);var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+id;document.head.appendChild(s)}function schedule(){if("requestIdleCallback" in window)requestIdleCallback(load,{timeout:4000});else setTimeout(load,2000)}if(document.readyState==="complete")schedule();else window.addEventListener("load",schedule)})();`,
      }}
    />
  );
}
