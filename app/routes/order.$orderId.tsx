import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { format, formatDistanceToNow } from "date-fns";
import { useCallback, useMemo } from "react";
import invariant from "tiny-invariant";
import { getCurrencyAmtFormatted, getUserLocale } from "~/utils/misc";
import { getOrderDetails } from "~/utils/queries.server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "~/components/ui/Table";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const orderId = params.orderId;
  invariant(orderId, "orderId must be given");

  const { order, productPics } = await getOrderDetails(orderId);

  if (!order) {
    throw new Response("Not found", { status: 404 });
  }

  const locale = getUserLocale(request.headers.get("Accept-Language"));

  return json({ order, productPics, locale });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: `Order details | ${data?.order.shop.full_name} | ShopAt.bio` },
];

export default function OrderDetails() {
  const { order, productPics, locale } = useLoaderData<typeof loader>();

  const date = useMemo(
    () => format(order.order_date, "do LLLL yyyy, KK:mm aaa"),
    [order.order_date]
  );
  const orderedAgo = useMemo(
    () => formatDistanceToNow(order.order_date) + " ago",
    [order.order_date]
  );

  const formatCurrency = useCallback(
    (amount: number) =>
      getCurrencyAmtFormatted(
        amount,
        order.currency.multiplier,
        order.currency.symbol,
        locale
      ),
    [locale, order.currency.multiplier, order.currency.symbol]
  );

  return (
    <div>
      <h1 className="m-4 text-2xl">Order details</h1>

      <Table className="bg-white bg-opacity-60 rounded-xl">
        <TableBody>
          <TableRow>
            <TableHead>Date & time</TableHead>
            <TableCell>
              {date} ({orderedAgo})
            </TableCell>
          </TableRow>
          <TableRow>
            <TableHead>Order Id</TableHead>
            <TableCell>
              <code>{order.id}</code>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableHead>Current status</TableHead>
            <TableCell>
              <code>{order.status}</code>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableHead>Payment method</TableHead>
            <TableCell>{order.payment_method}</TableCell>
          </TableRow>
          <TableRow>
            <TableHead>Delivery address</TableHead>
            <TableCell>
              <pre className="font-sans">
                {order.buyer.address.delivery?.address}
              </pre>
              <p>PIN: {order.buyer.address.delivery?.pin}</p>
              <p>District: {order.buyer.address.delivery?.district}</p>
              <p>State: {order.buyer.address.delivery?.state}</p>
              <p>Country: {order.buyer.address.delivery?.country}</p>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableHead>Contact details</TableHead>
            <TableCell>
              <p>Email: {order.buyer.contact.email}</p>
              <p>
                Phone: +{order.buyer.contact.phone?.isd}-
                {order.buyer.contact.phone?.num}
              </p>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <h2 className="m-4 mt-8 text-lg">Products in this order</h2>

      <ol>
        {order.products.map((product) => {
          const link = `../p/${product.id}?ref_order_id=${order.id}`;

          return (
            <li key={product.id} className="mb-2">
              <div className="rounded-xl p-4 grid grid-cols-4 gap-2 border hover:shadow-lg bg-white bg-opacity-70">
                <div className="col-span-3">
                  <Link
                    className="hover:underline hover:text-blue-500"
                    to={link}
                  >
                    {product.name}
                  </Link>

                  <div className="my-4">
                    <p className="text-xs">Qty: {product.qty}</p>
                    <p className="text-xs">
                      Price per unit: {formatCurrency(product.price)}
                    </p>
                    <p className="text-xs">
                      Item cost total:{" "}
                      {formatCurrency(
                        product.price * product.qty + product.tax.amount
                      )}
                    </p>
                    <p className="text-xs">
                      Taxes: {formatCurrency(product.tax.amount)} (
                      {product.tax.rate * 100}%)
                    </p>
                  </div>
                </div>

                <div>
                  <Link to={link}>
                    <img
                      src={productPics[product.id]}
                      alt={`${product.name}'s illustration`}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <h2 className="m-4 mt-8 text-lg">
        Payment summary ({order.payment_method})
      </h2>

      <Table className="bg-white bg-opacity-60 rounded-xl mb-16">
        <TableBody>
          <TableRow>
            <TableHead>Subtotal</TableHead>
            <TableCell className="text-right">
              {formatCurrency(order.subtotal)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableHead>Discounts</TableHead>
            <TableCell className="text-right">
              {formatCurrency(order.discounts)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableHead>Taxes</TableHead>
            <TableCell className="text-right">
              {formatCurrency(order.taxes)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableHead>Delivery cost</TableHead>
            <TableCell className="text-right">
              {formatCurrency(order.delivery_fee)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableHead>Grand total</TableHead>
            <TableCell className="text-right font-bold text-xl">
              {formatCurrency(order.grandtotal)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
