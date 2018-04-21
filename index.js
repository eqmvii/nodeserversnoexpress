var http = require("http");

const PORT = 4000;

// Callback handling the request from the server and logging the URL hit
function handleRequest(request, response) {
    var path = request.url;

    switch (path) {
        case "/":
            displayHome(path, request, response);
            break;
        default:
            response.end(`Server works! Path: ${request.url}`);
    }
}

function displayHome(path, req, res) {
    var homeHTML = `
    <html>
        <head>
            <title>Node.js Server Testing</title>
        </head>
        <body>
            <h1>Hello World!</h1>
            <p>This is the root.</p>
        </body>
    </html>
    `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(homeHTML);
}

var server = http.createServer(handleRequest);

server.listen(PORT, function () {
    console.log(`Server #1 is up and listening: http://localhost: ${PORT}`);
});
