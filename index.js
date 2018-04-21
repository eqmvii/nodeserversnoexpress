var http = require("http");

const PORT = 4000;

// Callback handling the request from the server and logging the URL hit
function handleRequest(request, response) {
  response.end(`Server works! Path: ${request.url}`);
}

var server = http.createServer(handleRequest);

server.listen(PORT, function() {
  console.log("Server up and listening: http://localhost:" + PORT);
});

