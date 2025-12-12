import React, { useEffect, useRef, useState } from "react";

type PhoneInputProps = {
  value?: string; // full phone like '09121234567' or ''
  onChange?: (fullPhone: string) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
};

const DIGITS = 9; // number of digits after the fixed '09'

const PhoneInput: React.FC<PhoneInputProps> = ({
  value = "",
  onChange,
  name,
  disabled,
  className,
  required,
  autoFocus,
}) => {
  // Keep internal digits state (array of single chars)
  const [digits, setDigits] = useState<string[]>(() => Array(DIGITS).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Initialize from value
  useEffect(() => {
    const v = (value || "").replace(/\D/g, "");
    let payload = v;
    if (v.startsWith("09")) payload = v.slice(2);
    // take only DIGITS chars
    const arr = Array.from({ length: DIGITS }, (_, i) => payload[i] || "");
    setDigits(arr);
  }, [value]);

  // Notify parent with full phone
  const triggerChange = (arr: string[]) => {
    const joined = arr.join("");
    const full = joined ? `09${joined}` : "";
    onChange?.(full);
  };

  const focusAt = (index: number) => {
    const idx = Math.max(0, Math.min(DIGITS - 1, index));
    const el = inputsRef.current[idx];
    if (el) el.focus();
  };

  // Enforce sequential filling: typed digits always go to the first empty slot.
  // Prevent typing/inserting in the middle.
  const handleChange = (index: number, raw: string) => {
    if (disabled) return;
    const ch = raw.replace(/\D/g, "").slice(0, 1);
    if (!ch) return;

    setDigits((prev) => {
      const copy = [...prev];
      const firstEmpty = copy.findIndex((c) => c === "");
      // If no empty slot, append at last position (overwrite last)
      const target =
        firstEmpty === -1 ? Math.min(DIGITS - 1, index) : firstEmpty;
      copy[target] = ch;
      triggerChange(copy);
      // focus next cell after the one we filled
      setTimeout(() => {
        const next = target < DIGITS - 1 ? target + 1 : target;
        focusAt(next);
      }, 0);
      return copy;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    const k = e.key;
    if (k === "Backspace") {
      if (digits[index]) {
        // clear current
        setDigits((prev) => {
          const copy = [...prev];
          copy[index] = "";
          triggerChange(copy);
          return copy;
        });
      } else if (index > 0) {
        // if empty, move focus to previous (left) and clear that
        focusAt(index - 1);
        setDigits((prev) => {
          const copy = [...prev];
          copy[index - 1] = "";
          triggerChange(copy);
          return copy;
        });
      }
    } else if (k === "ArrowLeft" && index > 0) {
      focusAt(index - 1);
    } else if (k === "ArrowRight" && index < DIGITS - 1) {
      focusAt(index + 1);
    }
  };

  // On paste, start filling from the first empty slot (prevent middle inserts)
  const handlePaste = (e: React.ClipboardEvent, startIndex = 0) => {
    if (disabled) return;
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    const payload = text.startsWith("09") ? text.slice(2) : text;
    if (!payload) return;

    setDigits((prev) => {
      const copy = [...prev];
      const firstEmpty = copy.findIndex((c) => c === "");
      const start = firstEmpty === -1 ? 0 : firstEmpty;
      for (let i = 0; i < payload.length && start + i < DIGITS; i++) {
        copy[start + i] = payload[i];
      }
      triggerChange(copy);
      const lastIndex = Math.min(DIGITS - 1, start + payload.length - 1);
      setTimeout(
        () => focusAt(lastIndex < DIGITS - 1 ? lastIndex + 1 : lastIndex),
        0
      );
      return copy;
    });
  };

  // When an input receives focus (or is clicked), redirect focus to the first empty slot
  // so caret is always shown at the next position to fill.
  const handleFocusRedirect = (index: number) => {
    if (disabled) return;
    const firstEmpty = digits.findIndex((c) => c === "");
    const target = firstEmpty === -1 ? DIGITS - 1 : firstEmpty;
    if (target !== index) {
      // Defer to avoid interfering with native focus sequence
      setTimeout(() => focusAt(target), 0);
    }
  };

  const handleMouseDownRedirect = (e: React.MouseEvent, index: number) => {
    if (disabled) return;
    // Prevent the clicked input from receiving the native focus so we can programmatically
    // move focus to the correct first-empty input without showing the caret briefly in the wrong place.
    e.preventDefault();
    const firstEmpty = digits.findIndex((c) => c === "");
    const target = firstEmpty === -1 ? DIGITS - 1 : firstEmpty;
    focusAt(target);
  };

  return (
    <div className={`phone-input-wrapper ${className || ""}`}>
      <span className="fixed-prefix" aria-hidden>
        09
      </span>

      <div className="digits-wrapper">
        <div dir="ltr" className="digits" role="group" aria-label="شماره تلفن">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={(e) => handlePaste(e, i)}
              onFocus={() => handleFocusRedirect(i)}
              onMouseDown={(e) => handleMouseDownRedirect(e, i)}
              disabled={disabled}
              aria-label={`رقم ${i + 1}`}
              className="digit"
              autoFocus={autoFocus && i === 0}
            />
          ))}
        </div>
      </div>

      {/* Hidden real input for forms */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={digits.join("") ? `09${digits.join("")}` : ""}
        />
      )}

      <style jsx>{`
        .phone-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          /* reverse order so prefix sits on the right and digits flow left */
          flex-direction: row-reverse;
          width: 100%;
        }
        .fixed-prefix {
          color: #10b981;
          font-weight: 600;
          font-size: 14px;
          padding: 0 4px;
          border-radius: 4px;
          background: transparent;
          border: none;
          box-shadow: none;
          font-family: inherit;
          text-align: center;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .digits-wrapper {
          display: flex;
          align-items: center;
          border-radius: 12px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.01),
            rgba(255, 255, 255, 0.02)
          );
          border: 1px solid rgba(255, 255, 255, 0.03);
          padding: 6px 8px;
          transition: box-shadow 160ms ease, border-color 160ms ease;
          flex: 1 1 auto;
          min-width: 0; /* allow shrinking inside narrow containers */
        }
        .digits-wrapper:focus-within {
          box-shadow: 0 8px 30px rgba(16, 185, 129, 0.06);
          border-color: rgba(16, 185, 129, 0.35);
        }
        .digits {
          /* responsive grid: digits share available width evenly */
          display: grid;
          grid-auto-flow: column;
          grid-template-columns: repeat(9, minmax(28px, 1fr));
          gap: 6px;
          align-items: center;
          width: 100%;
        }
        .digit {
          width: 100%;
          height: 40px;
          text-align: center;
          font-size: 15px;
          border-radius: 6px;
          background: transparent;
          color: #fff;
          border: none;
          outline: none;
          transition: transform 120ms ease, color 120ms ease;
          font-weight: 700;
          caret-color: #10b981;
          box-sizing: border-box;
        }
        .digit:focus {
          transform: translateY(-2px);
          color: #e6ffef;
        }

        @media (max-width: 980px) {
          .digits {
            grid-template-columns: repeat(9, minmax(22px, 1fr));
          }
          .digit {
            font-size: 14px;
            height: 36px;
          }
          .fixed-prefix {
            font-size: 13px;
          }
        }
        @media (max-width: 480px) {
          .digits {
            grid-template-columns: repeat(9, minmax(18px, 1fr));
            gap: 4px;
          }
          .digit {
            font-size: 13px;
            height: 34px;
          }
          .fixed-prefix {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default PhoneInput;
