import {
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { ChangeEventHandler, useEffect } from "react";
import { PriceSummary } from "~/components/PriceSummary";
import { getUserLocale } from "~/utils/misc";
import { getOrderPriceSummary } from "~/utils/orders.server";
import {
  getProducts,
  parseShoppingCartCookie,
  getPincodeDetails,
  getShopByHostName,
} from "~/utils/queries.server";
import { useDebounceCallback } from "usehooks-ts";

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = getUserLocale(request.headers.get("Accept-Language"));

  const shoppingCartContent = await parseShoppingCartCookie(request);
  const shop = await getShopByHostName(request.headers.get("Host"));

  const productsInCart = shoppingCartContent?.[shop.id] ?? [];
  if (productsInCart.length < 1) {
    return redirect("..");
  }

  const products = await getProducts(
    productsInCart.map((p) => p.productId),
    shop.id
  );

  const priceSummary = await getOrderPriceSummary(
    shoppingCartContent,
    shop,
    locale,
    products
  );

  return json({ shoppingCartContent, products, shop, priceSummary, locale });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: `Checkout | ${data?.shop.full_name} | ShopAt.bio`,
  },
];
interface FormField {
  name: string;
  label: string;
  type: React.HTMLInputTypeAttribute | "textarea";
  required: boolean;
}

const formFields: FormField[] = [
  {
    label: "Full name",
    name: "full_name",
    type: "text",
    required: true,
  },
  {
    label: "Email address",
    name: "email",
    type: "email",
    required: false,
  },
  {
    label: "Phone number",
    name: "phone",
    type: "tel",
    required: true,
  },
  {
    label: "Address",
    name: "address",
    type: "textarea",
    required: true,
  },
  {
    label: "PIN code",
    name: "pin",
    type: "number",
    required: true,
  },
  {
    label: "District",
    name: "district",
    type: "text",
    required: false,
  },
  {
    label: "State",
    name: "state",
    type: "text",
    required: true,
  },
  {
    label: "Country",
    name: "country",
    type: "text",
    required: true,
  },
];

export default function Checkout() {
  const { /* products, shop, shoppingCartContent, */ priceSummary } =
    useLoaderData<typeof loader>();

  // To fetch pincode
  const fetcher = useFetcher();

  const loadPincodeDetails = useDebounceCallback((pincode: string) => {
    if (pincode.length <= 0) return;
    fetcher.load(`../../pincode?pincode=${encodeURIComponent(pincode)}`);
  }, 1000);

  // Change input event listener for all fields
  const handleFieldOnChange =
    (
      name: string
    ): ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> =>
    (event) => {
      switch (name) {
        case "pin": {
          loadPincodeDetails(event.target.value);
          break;
        }
      }
    };

  // Populate country and state based on PIN code
  useEffect(() => {
    const pincodeDetails =
      fetcher.state === "idle" && fetcher.data
        ? (fetcher.data as ReturnType<typeof getPincodeDetails>)
        : [];

    if (!Array.isArray(pincodeDetails) || pincodeDetails.length < 1) {
      return;
    }
    const details = pincodeDetails.at(0);
    if (!details) return;

    const districtField = document.getElementById("field-district");
    if (districtField && districtField instanceof HTMLInputElement) {
      districtField.value = details.District;
    }

    const stateField = document.getElementById("field-state");
    if (stateField && stateField instanceof HTMLInputElement) {
      stateField.value = details.StateName;
    }

    const countryField = document.getElementById("field-country");
    if (countryField && countryField instanceof HTMLInputElement) {
      countryField.value = details.Country;
    }
  }, [fetcher.data, fetcher.state]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl">Checkout</h1>
        <p className="text-sm font-light">Please fill out the following form</p>
      </div>

      <Form method="post" action="success">
        <div className="mb-4">
          {formFields.map((field) => (
            <div key={field.name} className="my-2">
              <label>
                <p className={clsx({ "font-light": !field.required }, "mb-1")}>
                  {field.label}
                  {field.required ? (
                    <span
                      className="text-red-600 ml-1"
                      aria-label={`${field.label} is required`}
                    >
                      *
                    </span>
                  ) : (
                    <span className="text-xs ml-1">(optional)</span>
                  )}
                </p>

                {field.type === "textarea" ? (
                  <textarea
                    id={`field-${field.name}`}
                    name={field.name}
                    required={field.required}
                    rows={3}
                    onChange={handleFieldOnChange(field.name)}
                    className="w-full p-2 rounded-md bg-white bg-opacity-70 focus:bg-opacity-100"
                  ></textarea>
                ) : (
                  <input
                    id={`field-${field.name}`}
                    type={field.type}
                    name={field.name}
                    required={field.required}
                    onChange={handleFieldOnChange(field.name)}
                    className="w-full p-2 rounded-md bg-white bg-opacity-70 focus:bg-opacity-100"
                  />
                )}
              </label>
            </div>
          ))}

          <div className="my-2">
            <label>
              <p className="mb-1">Select payment method</p>
              <select
                name="payment_method"
                className="w-full  p-2 rounded-md bg-white bg-opacity-70 focus:bg-opacity-100"
              >
                <option value="COD">Cash on delivery</option>
              </select>
            </label>
          </div>
        </div>

        <div>
          <span className="text-red-600">*</span> - Required
        </div>

        <PriceSummary summary={priceSummary} className="my-4" />

        <div className="mt-8 mb-16 flex justify-center">
          <button
            type="submit"
            className="py-4 px-16 rounded-xl text-2xl shadow-lg bg-green-600 hover:bg-green-700 transition-all text-white"
          >
            Place your order
          </button>
        </div>
      </Form>
    </div>
  );
}
