import { forwardRef, useCallback, useLayoutEffect, useRef } from "react";
import {
  formatPhoneCSDisplay,
  normalizePhoneCSDigits,
  CZ_PHONE_RE,
} from "@/lib/phone.cs";

export { CZ_PHONE_RE } from "@/lib/phone.cs";

function digitIndexToCaret(i: number): number {
  if (i <= 3) return i;
  if (i <= 6) return i + 1;
  return i + 2;
}

function caretToDigitIndex(formatted: string, caret: number): number {
  let n = 0;
  for (let k = 0; k < caret && k < formatted.length; k++) {
    if (/\d/.test(formatted[k])) n++;
  }
  return n;
}

type Props = {
  value: string;
  onChange: (digits: string) => void;
  name?: string;
  placeholder?: string;
  required?: boolean;
};

export const PhoneInputCS = forwardRef<HTMLInputElement, Props>(function PhoneInputCS(
  { value, onChange, name = "phone", placeholder = "601 234 567", required },
  fwdRef,
) {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof fwdRef === "function") fwdRef(node);
      else if (fwdRef) (fwdRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    },
    [fwdRef],
  );

  const nextDigitCaretRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el || nextDigitCaretRef.current == null) return;
    const formatted = formatPhoneCSDisplay(value);
    const caret = Math.min(digitIndexToCaret(nextDigitCaretRef.current), formatted.length);
    try {
      el.setSelectionRange(caret, caret);
    } catch {
      /* ignore */
    }
    nextDigitCaretRef.current = null;
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const beforeCaret = el.selectionStart ?? el.value.length;
    const digitsBeforeCaret = caretToDigitIndex(el.value, beforeCaret);
    const next = normalizePhoneCSDigits(el.value);
    nextDigitCaretRef.current = Math.min(digitsBeforeCaret, next.length);
    onChange(next);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const next = normalizePhoneCSDigits(e.clipboardData.getData("text"));
    nextDigitCaretRef.current = next.length;
    onChange(next);
  }

  function handleBeforeInput(e: React.FormEvent<HTMLInputElement>) {
    const native = e.nativeEvent as InputEvent;
    const data = native.data;
    if (!data) return;
    const el = innerRef.current;
    if (!el) return;
    const selLen = (el.selectionEnd ?? 0) - (el.selectionStart ?? 0);
    const incoming = data.replace(/\D/g, "").length;
    if (incoming === 0) return;
    if (value.length - selLen + incoming > 9) {
      e.preventDefault();
    }
  }

  return (
    <div className="flex w-full items-stretch overflow-hidden rounded-lg border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40">
      <span className="inline-flex shrink-0 select-none items-center border-r border-input bg-secondary/60 px-3 text-base font-medium text-muted-foreground">
        +420
      </span>
      <input
        ref={setRefs}
        type="tel"
        name={name}
        required={required}
        inputMode="numeric"
        autoComplete="tel-national"
        pattern="[0-9 ]*"
        value={formatPhoneCSDisplay(value)}
        onChange={handleChange}
        onPaste={handlePaste}
        onBeforeInput={handleBeforeInput}
        maxLength={13}
        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base tracking-wider outline-none"
        placeholder={placeholder}
        aria-label="Telefonní číslo +420"
      />
    </div>
  );
});
