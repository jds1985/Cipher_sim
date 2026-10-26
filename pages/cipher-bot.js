// © 2026 Cipher CTS. All Rights Reserved.
import ProductPage from "../components/ProductPage";
import { getProduct } from "../lib/products";

export default function Page() {
  return <ProductPage product={getProduct("cipher-bot")} />;
}
