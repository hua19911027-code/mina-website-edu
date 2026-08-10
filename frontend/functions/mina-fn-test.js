export async function onRequest() {
  return new Response("MINA_FUNCTION_ALIVE", {
    headers: { "content-type": "text/plain" },
  });
}
