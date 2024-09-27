import { type MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "ShopAt.bio" },
    {
      name: "description",
      content: "Your own online store in your Instagram bio",
    },
  ];
};

export default function Index() {
  return <div className="flex h-screen items-center justify-center"></div>;
}
