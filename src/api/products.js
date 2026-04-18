import { apiRequest } from "./client.js";

export function getProducts() {
  return apiRequest("/products");
}
