export const dynamic = "force-dynamic";

export default async function Home() {
  let data = null;
  let error = null;

  try {
    const res = await fetch("http://backend:8000/health", { method: "GET" });
    if (!res.ok) {
      throw new Error(`Status: ${res.status}`);
    }
    data = await res.json();
  } catch (e: unknown) {
    if (e instanceof Error) {
      error = e.toString();
    } else {
      error = String(e);
    }
  }

  return (
    <div className="p-10 font-sans">
      <h1 className="text-2xl font-bold mb-4">Full Stack Connectivity Test</h1>

      <div className="border p-4 rounded bg-gray-100">
        <h2 className="font-semibold mb-2">Backend Connection (Server-Side)</h2>
        {error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <pre className="text-green-600 font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>

      <div className="mt-8 border p-4 rounded bg-white">
        <h2 className="mb-2">Environment</h2>
        <ul className="list-disc pl-5">
          <li>Frontend: Next.js + Bun + Biome</li>
          <li>Backend: FastAPI + uv + Ruff</li>
          <li>DB: Postgres + pgAdmin</li>
        </ul>
      </div>
    </div>
  );
}
