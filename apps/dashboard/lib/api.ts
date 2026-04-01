const API_BASE_URL = process.env.JELLYFISH_API_URL ?? "http://localhost:3002";
const API_KEY = process.env.JELLYFISH_API_KEY ?? "";

export async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: API_KEY ? { "x-api-key": API_KEY } : undefined,
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${path}`);
  }
  return response.json() as Promise<T>;
}
