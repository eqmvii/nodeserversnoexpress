var http = require("http");

const PORT = 4000;

// Callback handling the request from the server and logging the URL hit
function handleRequest(request, response) {
    var path = request.url;
    console.log(path);

    switch (path) {
        case "/":
            displayHome(path, request, response);
            break;
        case "/goodbye":
            displayGoodbye(path, request, response);
            break;
        case "/style.css":
            sendStyles(path, request, response);
            break;
        default:
            response.end(`Default... ${request.url}`);
    }
}

function displayHome(path, req, res) {
    var homeHTML = `
    <html>
        <head>
            <link rel="stylesheet" type="text/css" href="style.css">
            <title>Node.js Server Testing</title>
        </head>
        <body>
            <h1>Hello World!</h1>
            <p>This is the root.</p>
            <a href="/goodbye">Goodbye</a>
        </body>
    </html>
    `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(homeHTML);
}

function displayGoodbye(path, req, res) {
    var goodbyeHTML = `
    <html>
        <head>
            <link rel="stylesheet" type="text/css" href="style.css">
            <title>Goodbye!</title>
        </head>
        <body>
            <h1>Goodbye World!</h1>
            <p>See you later!</p>
            <a href="/">Return Home</a>
        </body>
    </html>
    `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(goodbyeHTML);
}

function sendStyles(path, req, res) {
    var styles = `
    body {
      color: blue;
    }

    h1 {
        text-align: center;
    }
    `;
    // res.writeHead(200, "content")
    res.end(styles);
}

var server = http.createServer(handleRequest);

server.listen(PORT, function () {
    console.log(`Server #1 is up and listening: http://localhost: ${PORT}`);
});
