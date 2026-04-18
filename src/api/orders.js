import { apiRequest } from "./client.js";

export function createOrder(payload) {
  return apiRequest("/orders", { method: "POST", body: payload });
}

export function getOrders() {
  return apiRequest("/orders");
}

export function getOrder(orderId) {
  return apiRequest(`/orders/${orderId}`);
}

export function submitOrderRating({ orderId, rating, message }) {
  return apiRequest(`/orders/${orderId}/rating`, {
    method: "POST",
    body: { rating, message },
  });
}
