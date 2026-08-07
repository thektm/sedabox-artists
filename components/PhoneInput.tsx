import React, { useEffect, useId, useRef, useState } from "react";

type PhoneInputProps = {
  value?: string;
  onChange?: (fullPhone: string) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
};

const DIGITS = 9;
const EMPTY_DIGITS = () => Array<string>(DIGITS).fill("");

const toPayload = (rawValue: string): string => {
  let value = rawValue.replace(/\D/g, "");

  if (value.startsWith("0098")) value = value.slice(4);
  else if (value.startsWith("98")) value = value.slice(2);

  if (value.startsWith("09")) value = value.slice(2);
  else if (value.length === 10 && value.startsWith("9")) value = value.slice(1);

  return value.slice(0, DIGITS);
};

const toDigits = (value: string): string[] => {
  const payload = toPayload(value);
  return Array.from({ length: DIGITS }, (_, index) => payload[index] || "");
};

const PhoneInput: React.FC<PhoneInputProps> = ({
  value = "",
  onChange,
  name,
  disabled,
  className,
  required,
  autoFocus,
}) => {
  const [digits, setDigits] = useState<string[]>(() => toDigits(value));
  const digitsRef = useRef(digits);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const idPrefix = useId().replace(/:/g, "");

  const setLocalDigits = (next: string[]) => {
    digitsRef.current = next;
    setDigits(next);
  };

  const emitChange = (next: string[]) => {
    const payload = next.join("");
    onChange?.(payload ? `09${payload}` : "");
  };

  const commitDigits = (next: string[]) => {
    setLocalDigits(next);
    emitChange(next);
  };

  useEffect(() => {
    const next = toDigits(value);
    if (next.join("") !== digitsRef.current.join("")) {
      setLocalDigits(next);
    }
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = digitsRef.current;
      if (current[0] === "0" && current.slice(1).every((digit) => digit === "")) {
        setLocalDigits(EMPTY_DIGITS());
      }
    }, 150);
    return () => window.clearTimeout(timer);
  }, []);

  const focusAt = (index: number) => {
    const safeIndex = Math.max(0, Math.min(DIGITS - 1, index));
    inputsRef.current[safeIndex]?.focus();
  };

  const nextWritableIndex = (requestedIndex: number) => {
    const firstEmpty = digitsRef.current.findIndex((digit) => digit === "");
    return firstEmpty === -1
      ? Math.max(0, Math.min(DIGITS - 1, requestedIndex))
      : firstEmpty;
  };

  const fillPayload = (payload: string, requestedIndex: number) => {
    if (!payload) return;

    const next = [...digitsRef.current];
    const start = nextWritableIndex(requestedIndex);
    const remaining = payload.slice(0, DIGITS - start);

    remaining.split("").forEach((digit, offset) => {
      next[start + offset] = digit;
    });

    commitDigits(next);
    const last = Math.min(DIGITS - 1, start + remaining.length - 1);
    window.setTimeout(() => focusAt(last < DIGITS - 1 ? last + 1 : last), 0);
  };

  const handleChange = (index: number, raw: string) => {
    if (disabled) return;
    const numeric = raw.replace(/\D/g, "");
    if (!numeric) return;

    if (numeric.length > 1) {
      fillPayload(toPayload(numeric), index);
      return;
    }

    fillPayload(numeric[0], index);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (disabled) return;

    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...digitsRef.current];
      const target = next[index] ? index : Math.max(0, index - 1);
      next[target] = "";
      commitDigits(next);
      window.setTimeout(() => focusAt(target), 0);
      return;
    }

    if (event.key === "حذف") {
      event.preventDefault();
      const next = [...digitsRef.current];
      next[index] = "";
      commitDigits(next);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight" && index < DIGITS - 1) {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    if (disabled) return;
    event.preventDefault();
    fillPayload(toPayload(event.clipboardData.getData("text")), index);
  };

  const focusFirstWritable = (event?: React.MouseEvent<HTMLInputElement>) => {
    if (disabled) return;
    event?.preventDefault();
    const firstEmpty = digitsRef.current.findIndex((digit) => digit === "");
    focusAt(firstEmpty === -1 ? DIGITS - 1 : firstEmpty);
  };

  const fullPhone = digits.join("") ? `09${digits.join("")}` : "";

  return (
    <div className={`phone-input-wrapper ${className || ""}`}>
      <span className="fixed-prefix" aria-hidden>
        09
      </span>

      <div className="digits-wrapper">
        <div dir="ltr" className="digits" role="group" aria-label="شماره تلفن">
          <div
            aria-hidden
            style={{
              position: "absolute",
              opacity: 0,
              height: 0,
              width: 0,
              overflow: "hidden",
              zIndex: -1,
            }}
          >
            <input type="text" name="user_id" tabIndex={-1} autoComplete="off" />
            <input type="text" name="phone" tabIndex={-1} autoComplete="off" />
            <input type="text" name="mobile" tabIndex={-1} autoComplete="off" />
          </div>

          {digits.map((digit, index) => (
            <input
              key={index}
              id={`${idPrefix}-phone-${index}`}
              name={`p_digit_${index}`}
              ref={(element) => {
                inputsRef.current[index] = element;
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onPaste={(event) => handlePaste(event, index)}
              onFocus={() => focusFirstWritable()}
              onMouseDown={(event) => focusFirstWritable(event)}
              disabled={disabled}
              required={required}
              autoComplete={index === 0 ? "tel" : "off"}
              data-lpignore="true"
              aria-label={`رقم ${index + 1}`}
              aria-required={required}
              className="digit"
              autoFocus={autoFocus && index === 0}
            />
          ))}
        </div>
      </div>

      {name && <input type="hidden" name={name} value={fullPhone} />}

      <style jsx>{`
        .phone-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
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
          transition:
            box-shadow 160ms ease,
            border-color 160ms ease;
          flex: 1 1 auto;
          min-width: 0;
        }
        .digits-wrapper:focus-within {
          box-shadow: 0 8px 30px rgba(16, 185, 129, 0.06);
          border-color: rgba(16, 185, 129, 0.35);
        }
        .digits {
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
          background-color: #121212 !important;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.05);
          outline: none;
          transition: all 120ms ease;
          font-weight: 700;
          caret-color: #10b981;
          box-sizing: border-box;
          -webkit-appearance: none;
          appearance: none;
        }
        .digit:-webkit-autofill,
        .digit:-webkit-autofill:hover,
        .digit:-webkit-autofill:focus,
        .digit:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #121212 inset !important;
          -webkit-text-fill-color: #fff !important;
          transition: background-color 5000s ease-in-out 0s;
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
