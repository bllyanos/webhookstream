Deno.serve({ port: 8081 }, async (req) => {
  const data = await req.json();

  console.log({
    body: data,
    headers: Object.fromEntries([...req.headers.entries()]),
    method: req.method,
  });

  return new Response("OK");
});
