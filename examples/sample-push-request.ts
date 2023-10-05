// test push

await fetch("http://localhost:8080", {
  body: JSON.stringify({
    message: "OK",
    data: "aaa-bbb-ccc-ddd",
  }),
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((res) => res.json())
  .then(console.log);
