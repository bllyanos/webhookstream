const encoder = new TextEncoder();
const json = JSON.stringify;

async function handleRequest(req: Request): Promise<Response> {
  const bc = new BroadcastChannel("request");

  const upgrade = req.headers.get("upgrade") ?? "";

  const reqId = crypto.randomUUID();

  if (upgrade === "sse") {
    // holds the bc listener
    let listener: (event: MessageEvent) => void;

    // holds interval id of heartbeat
    let intervalId: number | undefined;

    // stream as response body
    const body = new ReadableStream({
      start(controller) {
        const doHeartBeat = () => {
          const msg = json({ type: "heartbeat" });
          controller.enqueue(encoder.encode(msg));
        };

        intervalId = setInterval(doHeartBeat, 15_000);

        doHeartBeat();

        listener = (event: MessageEvent) => {
          const msg = json(event.data);
          controller.enqueue(encoder.encode(msg));
        };
        bc.addEventListener("message", listener);
      },
      cancel() {
        console.log("canceled");
        if (typeof intervalId === "number") clearInterval(intervalId);
        if (listener) bc.removeEventListener("message", listener);
      },
    });

    return new Response(body, {
      headers: { "Content-Type": "text/event-stream", "Request-Id": reqId },
    });
  }

  // parse as text
  const data = await req.text();
  const url = new URL(req.url);

  // push to bc
  const msg = {
    method: req.method,
    queryParams: url.searchParams.toString(),
    headers: Object.fromEntries([...req.headers]),
    body: data,
  };
  bc.postMessage(msg);

  // send response to webhook caller
  return new Response(json({ message: "OK" }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Request-Id": reqId },
  });
}

Deno.serve({ port: 8080 }, handleRequest);
