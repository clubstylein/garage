"use client";

import { useMemo, useState } from "react";
import { BillingLineDraft } from "@/components/billing-source-modal";

export default function ManualBillingLineModal({
  currency,
  onAdd,
  onClose,
}: {
  currency: string;
  onAdd: (line: BillingLineDraft) => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const amount = useMemo(() => {
    if (!billable) {
      return 0;
    }

    return Math.max(
      0,
      (Number(quantity) || 0) * (Number(unitPrice) || 0) -
        (Number(discount) || 0) +
        (Number(tax) || 0)
    );
  }, [
    quantity,
    unitPrice,
    discount,
    tax,
    billable,
  ]);

  function addLine() {
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    const quantityValue = Number(quantity);

    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    onAdd({
      key: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,
      lineType: "Manual",
      description: description.trim(),
      quantity: quantityValue,
      unitPrice: Number(unitPrice) || 0,
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
      billable,
      notes: notes.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e1e4e8] px-4 py-3">
          <div>
            <h3 className="text-lg font-semibold">
              Add Manual Bill Item
            </h3>

            <p className="mt-0.5 text-xs text-gray-500">
              Add a custom charge, service or non-billable line.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8dce1] bg-white text-lg text-gray-500 hover:bg-gray-50"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          <Field label="Description" required>
            <input
              autoFocus
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Labour, pickup, machining, custom charge..."
              className={inputClass}
            />
          </Field>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label={`Unit Price (${currency})`}>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(event) =>
                  setUnitPrice(event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Discount">
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(event) =>
                  setDiscount(event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Tax">
              <input
                type="number"
                step="0.01"
                value={tax}
                onChange={(event) =>
                  setTax(event.target.value)
                }
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-3">
            <Field label="Notes">
              <textarea
                rows={3}
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                className={textareaClass}
              />
            </Field>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg border border-[#e1e4e8] bg-[#fafafa] px-3 py-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={billable}
                onChange={(event) =>
                  setBillable(event.target.checked)
                }
                className="h-4 w-4"
              />

              Billable
            </label>

            <div className="text-sm">
              Amount{" "}
              <span className="ml-2 font-semibold">
                {currency}{" "}
                {Number(amount).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e1e4e8] bg-[#fafafa] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className={secondaryButton}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={addLine}
            className="h-10 rounded-lg bg-[#1d2228] px-5 text-sm font-medium text-white hover:bg-black"
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      {children}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-[#d8dce1] bg-white px-3 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

const textareaClass =
  "w-full resize-y rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-sm outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]";

const secondaryButton =
  "h-10 rounded-lg border border-[#d8dce1] bg-white px-4 text-sm font-medium hover:bg-gray-50";
