// Container browsers use the same advertised port as browsers on the host.
import http from "node:http";
http.createServer((request, response) => {
  const upstream = http.request({ hostname: "127.0.0.1", port: 3000, path: request.url, method: request.method, headers: request.headers }, result => {
    response.writeHead(result.statusCode, result.headers);
    result.pipe(response);
  });
  upstream.on("error", error => { response.writeHead(502); response.end(error.message); });
  request.pipe(upstream);
}).listen(Number(process.env.PDX_HOST_PORT || 4300), "127.0.0.1");
