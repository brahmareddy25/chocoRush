import { apiRequest } from "./client.js";

export function adminLogin(payload) {
  return apiRequest("/admin/login", { method: "POST", body: payload });
}

export function adminGetSession(sessionToken) {
  return apiRequest("/admin/session", { adminSessionToken: sessionToken });
}

export function adminGetDashboardData(sessionToken) {
  return apiRequest("/admin/dashboard", { adminSessionToken: sessionToken });
}

export function adminUpsertProduct({ sessionToken, product }) {
  return apiRequest("/admin/products/upsert", {
    method: "POST",
    body: { product },
    adminSessionToken: sessionToken,
  });
}

export function adminUpdateOrderStatus({ sessionToken, orderId, status, expectedDeliveryDate, note }) {
  return apiRequest(`/admin/orders/${orderId}/status`, {
    method: "POST",
    body: { status, expectedDeliveryDate, note },
    adminSessionToken: sessionToken,
  });
}
