import { parse } from "https://deno.land/std@0.203.0/flags/mod.ts";

const decoder = new TextDecoder();
const { _: [source, target] } = parse(Deno.args);

console.log(source, target);

if (!source || typeof source !== "string") {
  throw new Error("missing argument 1 : source");
}

if (!target || typeof target !== "string") {
  throw new Error("missing argument 2 : target");
}

fetch(source, {
  headers: { "upgrade": "sse" },
})
  .then((response) => response.body)
  .then(async (responseBody) => {
    console.log("connected to sse server.");

    const reader = responseBody!.getReader()!;
    console.log("got the reader!");

    let stop = false;
    do {
      try {
        const { done, value } = await reader.read();
        if (done) {
          stop = done;
        }
        const strvalue = decoder.decode(value);
        console.log(strvalue);

        // pipe data
        const parsedData = JSON.parse(strvalue);

        if (parsedData.type === "heartbeat") {
          continue;
        }

        console.log("piping...");
        const url = new URL(target);
        const params = new URLSearchParams(parsedData.queryParams);

        for (const [key, value] of params.entries()) {
          url.searchParams.set(key, value);
        }

        console.log(parsedData);

        fetch(url.toString(), {
          method: parsedData.method,
          headers: parsedData.headers,
          body: parsedData.body,
        });

        console.log("done");
      } catch (err) {
        console.error(err);
      }
    } while (!stop);
    reader.releaseLock();
  });
