"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_JELLYFISH_API_URL ?? "http://localhost:3002";
const API_KEY = process.env.NEXT_PUBLIC_JELLYFISH_API_KEY ?? "";

export async function postApi<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed: ${response.status} ${path} ${text}`);
  }
  return response.json() as Promise<T>;
}

export async function getApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: API_KEY ? { "x-api-key": API_KEY } : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed: ${response.status} ${path} ${text}`);
  }
  return response.json() as Promise<T>;
}
