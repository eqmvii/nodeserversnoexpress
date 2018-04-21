var http = require("http");
var fs = require("fs");
var mysql = require("mysql");


const PORT = 4000;

// sql connection
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password", // so secure I know
    database: "urlong_db"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log(`MySQL DB connected as ${connection.threadId}`);
});

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
    getUrlsFromDB((urls) => {
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
                <hr />
                <form action="/test.html" method="post">
                    URL to make long:<br />
                    <input type="text" name="url"><br />
                    <input type="submit"></input>
                </form>
                <hr />
                ${urls}
                </body>
        </html>
    `;
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(homeHTML);

    });

}

// connection.query('INSERT INTO songs (title, artist, genre) VALUES (?, ?, ?)', [answers.title, answers.artist, answers.genre], function () {


function getUrlsFromDB(callback) {
    connection.query("SELECT * FROM urls", (err, res) => {
        if (err) throw err;
        console.log(`DB url results length: ${res.length}`);
        urls = '<ul>'
        for (let i = 0; i < res.length; i ++) {
            urls += '<li>';
            urls += res[0].url;
            urls += " ";
            urls += res[0].urlong;
            urls += '</li>';
        }
        urls += '</ul>';
        // urls = `<h1>Fake URLS</h1>`;
        callback(urls);
    });
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

    h1, p, a, ul {
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
    fs.readFile(__dirname + "/test.html", function (err, data) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
    });
}

var server = http.createServer(handleRequest);

server.listen(PORT, function () {
    console.log(`Server #1 is up and listening: http://localhost: ${PORT}`);
});
