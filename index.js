var http = require("http");
var fs = require("fs");

const PORT = 4000;

// Callback handling the request from the server and logging the URL hit
function handleRequest(request, response) {
    var path = request.url;
    console.log(`Path requested: ${path}`);
    serverLog(path);

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
        case "/test.html":
            sendTestHTML(path, request, response);
            break;
        default:
            error404Page(path, request, response);
    }
}

function serverLog(path) {
    var now = new Date();
    var logText = "Request at " + now.toLocaleDateString() + " " + now.toLocaleTimeString() + ": " + path + "\n";
    fs.appendFile("serverLog.txt", logText, (err) => {
        if (err) {
            console.log("error writing logs");
        } else {
            console.log("Logging Complete.");
        }
    })
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
            <p><a href="/test.html">This will serve test.html</a></p>
            <p><a href="/notARealPage">This link will 404</a></p>
            <p><a href="/goodbye">Goodbye</a></p>
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
            <p><a href="/">Return Home</a></p>
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
      font-family: monospace;
    }

    h1, p, a {
        text-align: center;
    }
    `;
    // res.writeHead(200, "content")
    res.end(styles);
}

function error404Page(path, req, res) {
    var errorHTML = `
    <html>
        <head>
            <link rel="stylesheet" type="text/css" href="style.css">
            <title>404 Error - Page Not Fond</title>
        </head>
        <body>
            <h1>404 Error - Page Not Found</h1>
            <p>Couldn't find ${path} on server :( </p>
            <p><a href="/">Return Home</a></p>
        </body>
    </html>
    `;
  res.writeHead(404, { "Content-Type": "text/html" });
  res.end(errorHTML);
}

function sendTestHTML(path, req, res) {
    fs.readFile(__dirname + "/test.html", function(err, data) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
    });
}

var server = http.createServer(handleRequest);

server.listen(PORT, function () {
    console.log(`Server #1 is up and listening: http://localhost: ${PORT}`);
});
