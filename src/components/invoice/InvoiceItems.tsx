import React from 'react';
import { LineItem, BusinessSettings } from '../../types/erp';

interface InvoiceItemsProps {
  items: LineItem[];
  business: BusinessSettings;
  isEditable?: boolean;
  onUpdateItem?: (id: string, updated: Partial<LineItem>) => void;
  onRemoveItem?: (id: string) => void;
}

export const InvoiceItems: React.FC<InvoiceItemsProps> = ({
  items,
  business,
  isEditable = false,
  onUpdateItem,
  onRemoveItem,
}) => {
  const currency = business.currency || 'R';

  return (
    <div className="my-6">
      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-[#C98A5B]/30 shadow-2xs bg-[#FAF7F2]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#23170F] text-[#FAF6F0] font-serif uppercase tracking-wider text-[11px] border-b border-[#C98A5B]">
              <th className="py-3 px-4 font-semibold text-center w-16">
                Qty
              </th>
              <th className="py-3 px-4 font-semibold">
                Description
              </th>
              <th className="py-3 px-4 font-semibold text-right w-28 sm:w-32">
                Unit Price
              </th>
              <th className="py-3 px-4 font-semibold text-right w-28 sm:w-36">
                Total
              </th>
              {isEditable && <th className="py-3 px-2 w-10 text-center"></th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#C98A5B]/20 text-[#23170F]">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={isEditable ? 5 : 4}
                  className="py-10 text-center text-[#8C5329] font-serif italic text-sm"
                >
                  No line items on this invoice. Add products below.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unitPrice) || 0;
                const lineTotal = item.total !== undefined ? Number(item.total) : qty * price;

                return (
                  <tr
                    key={item.id || index}
                    className={`transition-colors ${
                      index % 2 === 0 ? 'bg-[#FAF6F0]' : 'bg-[#F5EFEB]/70'
                    } hover:bg-[#EFE7DE]/50`}
                  >
                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-xs text-[#23170F]">
                      {isEditable && onUpdateItem ? (
                        <input
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) => {
                            const newQty = parseFloat(e.target.value) || 0;
                            onUpdateItem(item.id, {
                              quantity: newQty,
                              total: Math.round(newQty * price * 100) / 100,
                            });
                          }}
                          className="w-14 text-center py-1 px-1.5 rounded bg-white border border-[#C98A5B]/40 text-[#23170F] font-mono text-xs focus:outline-hidden focus:border-[#8C5329]"
                        />
                      ) : (
                        qty
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 font-sans">
                      {isEditable && onUpdateItem ? (
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            onUpdateItem(item.id, { description: e.target.value })
                          }
                          className="w-full py-1 px-2 rounded bg-white border border-[#C98A5B]/40 text-[#23170F] text-xs focus:outline-hidden focus:border-[#8C5329]"
                        />
                      ) : (
                        <div>
                          <div className="font-semibold text-[#23170F] text-xs sm:text-[13px]">
                            {item.description}
                          </div>
                          {item.sku && (
                            <div className="font-mono text-[10px] text-[#8C5329] mt-0.5">
                              SKU: {item.sku} {item.packSize ? `· ${item.packSize}` : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Unit Price */}
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-[#3E2C22] tabular-nums">
                      {isEditable && onUpdateItem ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[11px] text-[#8C5329]">{currency}</span>
                          <input
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              onUpdateItem(item.id, {
                                unitPrice: newPrice,
                                total: Math.round(qty * newPrice * 100) / 100,
                              });
                            }}
                            className="w-20 text-right py-1 px-1.5 rounded bg-white border border-[#C98A5B]/40 text-[#23170F] font-mono text-xs focus:outline-hidden focus:border-[#8C5329]"
                          />
                        </div>
                      ) : (
                        `${currency} ${price.toFixed(2)}`
                      )}
                    </td>

                    {/* Line Total */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-xs sm:text-sm text-[#23170F] tabular-nums">
                      {currency} {lineTotal.toFixed(2)}
                    </td>

                    {/* Remove Action (Editable mode) */}
                    {isEditable && onRemoveItem && (
                      <td className="py-3.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-rose-500 hover:text-rose-700 text-sm font-bold p-1 rounded hover:bg-rose-50"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
