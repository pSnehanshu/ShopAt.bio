import { json, LoaderFunctionArgs } from "@remix-run/node";
import * as v from "valibot";
import { getPincodeDetails } from "~/utils/queries.server";

const PincodeSchema = v.pipe(v.string(), v.trim(), v.digits(), v.length(6));

export function loader({ request }: LoaderFunctionArgs) {
  const raw_pincode = new URL(request.url).searchParams.get("pincode");
  const parseResult = v.safeParse(PincodeSchema, raw_pincode);

  if (!parseResult.success) {
    return new Response("Invalid input", { status: 400 });
  }

  const pincode = parseResult.output;
  const result = getPincodeDetails(pincode);
  return json(result);
}
