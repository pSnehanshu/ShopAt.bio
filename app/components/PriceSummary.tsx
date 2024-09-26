import { type SerializeFrom } from "@remix-run/node";
import clsx from "clsx";
import type { getOrderPriceSummary } from "~/utils/orders.server";

export function PriceSummary({
  summary,
  className,
}: {
  summary: SerializeFrom<typeof getOrderPriceSummary>;
  className?: string;
}) {
  return (
    <div className={clsx("border rounded-xl overflow-hidden", className)}>
      <div className="px-4 py-2 bg-gray-300">
        <h2 className="font-bold">Price summary</h2>
      </div>

      <table className="w-full text-sm">
        <tbody>
          <tr>
            <th className="text-left px-4 py-2 font-normal">Subtotal</th>
            <td className="text-right px-4 py-2 font-bold">
              {summary.subtotalDisplay}
            </td>
          </tr>
          <tr>
            <th className="text-left px-4 py-2 font-normal">Taxes</th>
            <td className="text-right px-4 py-2 font-bold">
              {summary.taxAmountDisplay}
            </td>
          </tr>
          <tr>
            <th className="text-left px-4 py-2 font-normal">Delivery fee</th>
            <td
              className={clsx("text-right px-4 py-2 font-bold", {
                "text-green-600": summary.deliveryAmount === 0,
              })}
            >
              {summary.deliveryAmount === 0
                ? "Free"
                : summary.deliveryAmountDisplay}
            </td>
          </tr>
          <tr>
            <th className="text-left px-4 py-2 font-normal">Grand total</th>
            <td className="text-right px-4 py-2 text-green-600 font-extrabold text-2xl">
              {summary.grandtotalDisplay}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
