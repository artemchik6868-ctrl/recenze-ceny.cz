// Persist ProductBrief snapshot for audit. Fail-soft: any write error is
// logged and swallowed so the audit layer never breaks content generation.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ProductBrief } from "./product-brief";
import type { QAResult } from "./qa-validator";

export type PersistBriefInput = {
  brief: ProductBrief;
  sourceHash: string;
  pipelineVersion: string;
  qaUk: QAResult;
  qaRu: QAResult;
  qaStatusUk: string;
  qaStatusRu: string;
};

export async function persistBriefSnapshot(input: PersistBriefInput): Promise<void> {
  const { brief, sourceHash, pipelineVersion, qaUk, qaRu, qaStatusUk, qaStatusRu } = input;
  try {
    const { error } = await supabaseAdmin.from("product_briefs").upsert(
      {
        source: brief.source,
        offer_id: brief.offerId,
        pipeline_version: pipelineVersion,
        source_hash: sourceHash,
        category_slug: brief.categorySlug,
        brand: brief.brand || null,
        clean_title: brief.cleanTitle || null,
        physical_form: brief.physicalForm.kind,
        brief_confidence: brief.confidence,
        warnings: brief.warnings ?? [],
        allowed_lex_uk: brief.allowedLexicon.uk ?? [],
        allowed_lex_ru: brief.allowedLexicon.ru ?? [],
        forbidden_lex_uk: brief.forbiddenLexicon.uk ?? [],
        forbidden_lex_ru: brief.forbiddenLexicon.ru ?? [],
        cleaned_desc_len: brief.cleanedDescription.length,
        qa_status_uk: qaStatusUk,
        qa_status_ru: qaStatusRu,
        qa_errors_uk: qaUk.errors ?? [],
        qa_errors_ru: qaRu.errors ?? [],
        generated_at: new Date().toISOString(),
      },
      { onConflict: "source,offer_id" },
    );
    if (error) {
      console.warn(`[brief-audit] persist failed for ${brief.source}:${brief.offerId}: ${error.message}`);
    }
  } catch (err) {
    console.warn(`[brief-audit] persist threw for ${brief.source}:${brief.offerId}:`, err);
  }
}
