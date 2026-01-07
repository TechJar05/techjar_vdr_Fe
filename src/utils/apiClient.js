import { API_BASE_URL } from "../config/apiConfig";

const buildHeaders = (isFormData, customHeaders = {}) => {
  const headers = { ...customHeaders };
  if (!isFormData) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
};

export const apiRequest = async (
  endpoint,
  { method = "GET", body, headers, auth = true, skipJson = false } = {}
) => {
  const isFormData = body instanceof FormData;
  const finalHeaders = auth ? buildHeaders(isFormData, headers) : headers || {};

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: finalHeaders,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorPayload = await parseResponse(response).catch(() => ({}));
    const errorMessage =
      typeof errorPayload === "string"
        ? errorPayload
        : errorPayload?.message || "Request failed";
    throw new Error(errorMessage);
  }

  if (skipJson) return response;

  return parseResponse(response).catch(() => ({}));
};

export default apiRequest;

