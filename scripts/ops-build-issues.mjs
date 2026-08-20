/**
 * Pure ops issue builder (tier B pageable incidents).
 * Warehouse stock (tier C) is never turned into issues — only fresh_* and structural faults.
 *
 * Used by ops-telegram-digest.mjs and unit tests (no network).
 */

/** @typedef {{ code: string, text: string }} OpsIssue */

/**
 * Fresh facts that may page (tier B). transient_fetch is warehouse — never page.
 * @param {number} total
 * @param {object} [byClass]
 * @returns {number}
 */
export function pageableFreshExhausted(total, byClass = {}) {
  const n = Number(total || 0);
  const transient = Number(byClass?.transient_fetch ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const t = Number.isFinite(transient) ? Math.max(0, transient) : 0;
  return Math.max(0, n - t);
}

/**
 * Parse `dead=` / `transient=` / `thin=` / `thin_llm=` / `other=` from a newly-exhausted alert.
 * @param {string} text
 * @returns {{ terminal_dead: number, transient_fetch: number, thin_llm: number, other: number } | null}
 */
export function parseFactsClassFromAlert(text) {
  const a = String(text);
  const dead = a.match(/\bdead=(\d+)/i);
  const transient = a.match(/\btransient(?:_fetch)?=(\d+)/i);
  const thin = a.match(/\bthin(?:_llm)?=(\d+)/i);
  const other = a.match(/\bother=(\d+)/i);
  if (!dead && !transient && !thin && !other) return null;
  return {
    terminal_dead: dead ? Number(dead[1]) : 0,
    transient_fetch: transient ? Number(transient[1]) : 0,
    thin_llm: thin ? Number(thin[1]) : 0,
    other: other ? Number(other[1]) : 0,
  };
}

/**
 * @param {object} status pipeline-status JSON body
 * @param {object} [opts]
 * @param {boolean} [opts.skipPublicSitemap=true] — when true, do not check sitemap (default for pure)
 * @param {{ ok: boolean, text: string | null } | null} [opts.publicSitemap] — inject sitemap result
 * @param {object} [opts.thresholds] — min counts overrides
 * @returns {OpsIssue[]}
 */
export function buildIssuesFromStatus(status, opts = {}) {
  const t = {
    staleMin: 5,
    repeatedFailMin: 3,
    indexingErrorMin: 10,
    inspectErrorMin: 5,
    imageFactsFailMin: 5,
    landingFactsFailMin: 5,
    ...(opts.thresholds || {}),
  };

  const ops = status?.ops ?? {};
  const totals = status?.totals ?? {};
  const alerts = Array.isArray(status?.alerts) ? status.alerts : [];
  const issues = [];

  let stale = Number(ops.stale_content ?? totals.stale_content ?? 0);
  let repeated = Number(ops.repeated_failures ?? totals.repeated_failures ?? 0);
  const missing = Number(totals.missing_content ?? 0);
  let feedErr = ops.feed_wave_error || status?.feed_wave?.last_error || null;
  let feedStale = Boolean(ops.feed_wave_stale || status?.feed_wave?.stale);
  let feedSyncStale = Boolean(ops.feed_sync_stale);
  let indexingErr = Number(ops.indexing_errors_24h ?? 0);
  let indexingCfg = Number(ops.indexing_config_skips_24h ?? 0);
  let inspectErr = Number(ops.inspect_errors_24h ?? 0);
  let imageFetchFresh = Number(ops.image_facts_fetch_error_fresh ?? 0);
  let imageExhaustedFresh = Number(ops.image_facts_exhausted_fresh ?? 0);
  let landingRetryFresh = Number(ops.landing_facts_retryable_fresh ?? 0);
  let landingExhaustedFresh = Number(ops.landing_facts_exhausted_fresh ?? 0);
  let imageExhaustedFreshByClass = ops.image_facts_exhausted_fresh_by_class || {};
  let landingExhaustedFreshByClass = ops.landing_facts_exhausted_fresh_by_class || {};
  let landingRetryFreshByClass = ops.landing_facts_retryable_fresh_by_class || {};
  const imageSamples = Array.isArray(ops.image_facts_error_samples)
    ? ops.image_facts_error_samples
    : [];
  const landingSamples = Array.isArray(ops.landing_facts_error_samples)
    ? ops.landing_facts_error_samples
    : [];
  let gscErrors = ops.gsc_sitemap_errors;
  let gscErrMsg = ops.gsc_sitemap_error || null;
  let gscSkipped = ops.gsc_sitemap_skipped || null;

  // Fallback when worker not yet redeployed with full `ops` block.
  if (!status?.ops || ops.inspect_errors_24h == null) {
    for (const a of alerts) {
      const staleMatch = String(a).match(/(\d+)\s+offers missing AI > 2h/i);
      if (staleMatch) stale += Number(staleMatch[1]);
      const failMatch = String(a).match(/(\d+)\s+offers have repeated AI failures/i);
      if (failMatch) repeated += Number(failMatch[1]);
      if (/feed-wave:\s*stale/i.test(a)) feedStale = true;
      if (/feed-sync:\s*stale/i.test(a)) feedSyncStale = true;
      if (/feed-wave:\s*last_error=/i.test(a) && !feedErr) {
        feedErr = String(a).replace(/^.*last_error=/i, "");
      }
      const idxErr = String(a).match(/indexing:\s*(\d+)\s+errors/i);
      if (idxErr) indexingErr = Math.max(indexingErr, Number(idxErr[1]));
      const idxCfg = String(a).match(/indexing:\s*(\d+)\s+skipped_config/i);
      if (idxCfg) indexingCfg = Math.max(indexingCfg, Number(idxCfg[1]));
      const insp = String(a).match(/indexing-retry:\s*(\d+)\s+GSC inspect/i);
      if (insp) inspectErr = Math.max(inspectErr, Number(insp[1]));
      const imgFetch = String(a).match(/image-facts:\s*(\d+)\s+fresh fetch_error/i);
      if (imgFetch) imageFetchFresh = Math.max(imageFetchFresh, Number(imgFetch[1]));
      const imgExFresh = String(a).match(/image-facts:\s*(\d+)\s+newly exhausted/i);
      if (imgExFresh) {
        imageExhaustedFresh = Math.max(imageExhaustedFresh, Number(imgExFresh[1]));
        const parsed = parseFactsClassFromAlert(a);
        if (parsed) imageExhaustedFreshByClass = parsed;
      }
      // Legacy warehouse alert text — never used for paging.
      const landFresh = String(a).match(/landing-facts:\s*(\d+)\s+fresh retryable/i);
      if (landFresh) {
        landingRetryFresh = Math.max(landingRetryFresh, Number(landFresh[1]));
        const parsed = parseFactsClassFromAlert(a);
        if (parsed) landingRetryFreshByClass = parsed;
      }
      const landExFresh = String(a).match(/landing-facts:\s*(\d+)\s+newly exhausted/i);
      if (landExFresh) {
        landingExhaustedFresh = Math.max(landingExhaustedFresh, Number(landExFresh[1]));
        const parsed = parseFactsClassFromAlert(a);
        if (parsed) landingExhaustedFreshByClass = parsed;
      }
      const gsc = String(a).match(/gsc-sitemap:\s*(\d+)\s+errors/i);
      if (gsc) gscErrors = Math.max(Number(gscErrors ?? 0), Number(gsc[1]));
      if (/gsc-sitemap:\s*skipped_config/i.test(a)) gscSkipped = "no_token";
      if (/gsc-sitemap:\s*get failed/i.test(a) && !gscErrMsg) {
        gscErrMsg = String(a).replace(/^.*get failed —\s*/i, "");
      }
    }
  }

  if (stale >= t.staleMin) {
    issues.push({
      code: "stale_ai",
      text: `AI-контент застрял: ${stale} офферов без контента >2ч (всего без AI: ${missing})`,
    });
  }
  if (repeated >= t.repeatedFailMin) {
    issues.push({
      code: "ai_failures",
      text: `Повторяющиеся сбои AI: ${repeated} офферов с fail_count≥3`,
    });
  }
  if (feedSyncStale) {
    issues.push({
      code: "feed_sync_stale",
      text: "Синк фидов протух (synced_at старше 36ч) — проверьте GHA feed-sync / health-check",
    });
  }
  if (feedStale) {
    issues.push({
      code: "feed_wave_stale",
      text: "Волна фидов зависла (>26ч без прогресса)",
    });
  }
  if (feedErr) {
    issues.push({
      code: "feed_wave_error",
      text: `Ошибка волны фидов: ${String(feedErr).slice(0, 200)}`,
    });
  }
  if (indexingErr >= t.indexingErrorMin) {
    const idxSamples = Array.isArray(ops.indexing_error_samples)
      ? ops.indexing_error_samples
      : [];
    const sampleHint = idxSamples.length
      ? ` — ${idxSamples.slice(0, 2).join(" | ")}`
      : "";
    issues.push({
      code: "indexing_errors",
      text: `Индексация: ${indexingErr} ошибок за 24ч (IndexNow/Google/Seznam)${sampleHint}`,
    });
  }
  if (indexingCfg > 0) {
    issues.push({
      code: "indexing_config",
      text: `Индексация: ${indexingCfg} skipped_config за 24ч (проверьте ключи/SA)`,
    });
  }
  if (inspectErr >= t.inspectErrorMin) {
    issues.push({
      code: "inspect_errors",
      text: `GSC inspect (indexing-retry): ${inspectErr} ошибок за 24ч`,
    });
  }
  if (imageFetchFresh >= t.imageFactsFailMin) {
    const sampleHint = imageSamples.length
      ? ` — ${imageSamples.slice(0, 2).join(" | ")}`
      : "";
    issues.push({
      code: "image_facts_fetch",
      text: `Image-facts: ${imageFetchFresh} свежих fetch_error за 48ч (CDN/egress)${sampleHint}`,
    });
  }
  const imageExhaustedPageable = pageableFreshExhausted(
    imageExhaustedFresh,
    imageExhaustedFreshByClass,
  );
  if (imageExhaustedPageable >= t.imageFactsFailMin) {
    const by = imageExhaustedFreshByClass;
    const classHint =
      by.transient_fetch != null || by.thin_llm != null
        ? ` (transient=${by.transient_fetch ?? 0} thin_llm=${by.thin_llm ?? 0} other=${by.other ?? 0})`
        : "";
    const sampleHint = imageSamples.length
      ? ` — ${imageSamples.slice(0, 2).join(" | ")}`
      : "";
    issues.push({
      code: "image_facts_exhausted_fresh",
      text: `Image-facts: ${imageExhaustedFresh} newly exhausted за 48ч${classHint}${sampleHint}`,
    });
  }
  const landingRetryPageable = pageableFreshExhausted(
    landingRetryFresh,
    landingRetryFreshByClass,
  );
  if (landingRetryPageable >= t.landingFactsFailMin) {
    const by = landingRetryFreshByClass;
    const classHint =
      by.terminal_dead != null || by.transient_fetch != null
        ? ` (dead=${by.terminal_dead ?? 0} transient=${by.transient_fetch ?? 0} thin=${by.thin_llm ?? 0})`
        : "";
    const sampleHint = landingSamples.length
      ? ` — ${landingSamples.slice(0, 2).join(" | ")}`
      : "";
    issues.push({
      code: "landing_facts_retryable",
      text: `Landing-facts: ${landingRetryFresh} свежих retryable сбоев за 48ч${classHint}${sampleHint}`,
    });
  }
  const landingExhaustedPageable = pageableFreshExhausted(
    landingExhaustedFresh,
    landingExhaustedFreshByClass,
  );
  if (landingExhaustedPageable >= t.landingFactsFailMin) {
    const by = landingExhaustedFreshByClass;
    const classHint =
      by.terminal_dead != null || by.transient_fetch != null
        ? ` (dead=${by.terminal_dead ?? 0} transient=${by.transient_fetch ?? 0} thin=${by.thin_llm ?? 0})`
        : "";
    const sampleHint = landingSamples.length
      ? ` — ${landingSamples.slice(0, 2).join(" | ")}`
      : "";
    issues.push({
      code: "landing_facts_exhausted_fresh",
      text: `Landing-facts: ${landingExhaustedFresh} newly exhausted за 48ч${classHint}${sampleHint}`,
    });
  }
  if (gscSkipped === "no_token") {
    issues.push({
      code: "gsc_config",
      text: "GSC sitemap: нет токена (GOOGLE_INDEXING_SA_JSON / права Search Console)",
    });
  }
  if (gscErrMsg) {
    issues.push({
      code: "gsc_sitemap_api",
      text: `GSC sitemap API: ${String(gscErrMsg).slice(0, 200)}`,
    });
  }
  if (typeof gscErrors === "number" && gscErrors > 0) {
    issues.push({
      code: "gsc_sitemap_errors",
      text: `GSC sitemap: ${gscErrors} ошибок в Search Console`,
    });
  }

  if (opts.publicSitemap && !opts.publicSitemap.ok) {
    issues.push({ code: "public_sitemap", text: opts.publicSitemap.text });
  }

  return issues;
}

/** Warehouse / circuit legacy strings — never page, filter from health-fail dumps. */
export function isWarehouseStockAlert(text) {
  const a = String(text);
  return (
    /rows status exhausted\/fetch_error\s*\(circuit/i.test(a) ||
    /rows with fail_count[≥>=]\d+\s+or exhausted/i.test(a) ||
    /риск circuit breaker/i.test(a) ||
    /\bcircuit risk\b/i.test(a)
  );
}

export function fingerprintIssues(issues) {
  return issues
    .map((i) => i.code)
    .sort()
    .join("|");
}
