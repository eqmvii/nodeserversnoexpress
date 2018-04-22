/*
 *  index.js
 *  Contains the entire URLong app, including html and css, in one file
 *  Because... why not?
 *  by Eric Mancini launched 4/22/2018
 *  https://github.com/eqmvii/urlong
 */


//
// CONFIGURATION
//

var http = require("http");
var fs = require("fs");
var mysql = require("mysql");

const PORT = process.env.PORT || 4000; // prep for Heroku deployment
const HEARTBEAT = 3; // number of seconds to wait between DB pings to keep the connection alive
var age = 0;
var appRoot;


//
// SQL connection
//

var connection;

if (process.env.PORT) {
    connection = mysql.createConnection({
        host: "us-cdbr-iron-east-05.cleardb.net",
        user: "b9f6ab3105475d",
        password: "b9e3acac",
        database: "heroku_9771ee7f2284234"
    });
    console.log("CONNECTION:");
    console.log(connection);
    appRoot = `https://urlong.herokuapp.com`;
} else {
    connection = mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password", // so secure I know
        database: "urlong_db"
    });
    appRoot = `http://localhost:4000`;
}


//
// INITIALIZATION
//

turnOn(() => {
    console.log("I connected to the DB and nothing bad probably happened");
    var server = http.createServer(handleRequest);
    server.listen(PORT, function () {
        console.log(`Server #1 is up and listening: http://localhost: ${PORT}`);
    });
});


//
// FUNCTIONS
//

function turnOn(cb) {
    console.log(`### Connecting... ###`);
    connection.connect(function (err) {
        if (err) {
            console.log("Error connection to DB...");
            serverLog("Error connecting to DB :(");
            serverLog(err);
            cb();
            return;
        }
        console.log(`### MySQL DB connected as ${connection.threadId} ###`);
        createTableIfNecessary(() => {
            setInterval(() => {
                age++;
                if ((age % (30 / HEARTBEAT)) === 0) {
                    console.log(`Another 30 seconds has passed. I am still dumby querying the DB every ${HEARTBEAT} seconds. ${age} times so far.\nOmg this is so hacky.`);
                }
                connection.query('SELECT 1');
            }, HEARTBEAT * 1000);
            cb();
        });
    });
}

function createTableIfNecessary(cb) {
    connection.query(`SELECT * FROM urls`, (err, res) => {
        if (err) {
            // create the table
            connection.query(`CREATE TABLE urls (
                id INT NOT NULL AUTO_INCREMENT,
                url VARCHAR(2100) NULL,
                urlong VARCHAR(2100) NULL,
                PRIMARY KEY (id)
              );
              `, (err, res) => {
                    if (err) {
                        console.log("This was always too dumb to work, and it didn't.");
                        console.log(err);
                    } else {
                        console.log("This was incredibly dumb but it actually worked!");
                    }
                });
        }
        cb();
    });
}

function deleteAll() {
    connection.query(`DELETE FROM urls`, (err, res) => {
        console.log("Deleted all urls");
        serverLog("Deleted all urls");
    });
}

// Pointless middleware due to early confusion
// TODO: Remove this
function handleRequest(request, response) {
    finishRequest(request, response);
}

function finishRequest(request, response) {
    var path = request.url;
    console.log(`Request method: ${request.method}; Path requested: ${path}`);
    serverLog(path);

    if (request.method === "POST") {
        console.log("POST INCOMING AWOOGA");
        let body = []; // Node.js body parsing boilerplate
        request.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            console.log(`Original post body: ${body}`);
            var postUrl = decodeURIComponent(body.split("=")[1].replace(/\+/g, " ")); //.replace(/\%2F/g, "/").replace(/\%3A/g, ":");
            console.log(`Acshual: ${postUrl}`);
            // console.log(`Das YouAreEL: ${myUrl.toString()}`);
            console.log(postUrl)
            omniLog(`POST of URL ${postUrl}`);
            addUrlToDb(postUrl, (results) => {
                console.log(results);
                urlongResults(results, path, request, response);
                // redirectTest(path, request, response);
            });
        });
    } else { // so it's a GET
        // test for re-routing
        var chunk = path.substring(1, path.length);
        connection.query(`SELECT * FROM urls WHERE urlong = '${chunk}'`, (err, res) => {
            if (err) {
                console.log("Error testing for a URL route");
                serverLog("Error checking for server route");
                serverLog(err);
            }
            if (!err && res.length > 0) { // i.e. the URL exists
                console.log(`Exists! Should redirect to ${res[0].url}`);
                redirectArbitrary(res[0].url, path, request, response);
            } else {
                // we don't need to re-route, so look for a local route
                switch (path) { // TODO: Move to its own function
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
                    case "/redirecttest":
                        redirectTest(path, request, response);
                        break;
                    case "/thisisthesecretdeleteallfromthetableurl":
                        deleteAll();
                        displayHome(path, request, response);
                        break;
                    default:
                        error404Page(path, request, response);
                }
            }
        });
    }
}

function redirectArbitrary(destination, path, req, res) {
    if (destination.indexOf('https://') === -1 && destination.indexOf('http://') === -1) {
        destination = 'https://' + destination;
    }
    console.log("~~~~~~~~~~~~~~~~~~~~~~");
    console.log(`REDIRECTIN AWAY TO ${destination}`);
    console.log("~~~~~~~~~~~~~~~~~~~~~~");
    res.writeHead(302, {
        'Location': destination
    });
    res.end();
}

function addUrlToDb(path, callback) {
    cbdata = {};
    // test for existance of path in db
    // myUrl = new URL(path);
    // console.log(`Original: ${path}; parsed: ${myUrl.href}`);
    connection.query(`SELECT * FROM urls WHERE url = '${path}'`, (err, res) => {
        if (err) {
            console.log("Error checking URL before adding to db");
            serverLog("Error checking URL before adding to db");
            serverLog(err);
            callback({});
            return;
        }
        if (res.length > 0) { // i.e. the URL exists
            cbdata.message = "url already in db";
            cbdata.success = false;
            cbdata.url = res[0].url;
            cbdata.urlong = res[0].urlong;
            callback(cbdata);
            return;
        } else { // it doesn't already exist, so insert it
            // connection.query(`INSERT INTO urls (url, urlong) VALUES ('${path}', '${"hmm" + Date.now() + "cheese" + path.length + path[0] + "oh"}');`, (err, res) => {
            var tempUrlong = urlongify(path);
            connection.query(`INSERT INTO urls (url, urlong) VALUES ('${path}', '${tempUrlong}');`, (err, res) => {
                if (err) {
                    console.log("Error inserting URL to db");
                    serverLog("Error inserting URL to db");
                    serverLog(err);
                    callback({});
                    return;
                }
                console.log("Addddded!");
                cbdata.message = "we good";
                cbdata.success = true;
                cbdata.url = path;
                cbdata.urlong = tempUrlong;
                callback(cbdata);
            });
        }
    });
}

function urlongify(shortPath) {
    var longPath = "";
    if (shortPath.length > 1000) {
        console.log("Woah that's already crazy long");
        return longPath + Date.now() + shortPath;
    }
    for (let i = 0; i < 400; i++) {
        longPath += Math.floor((Math.random() * 10));
    }
    longPath += `urlong`;
    longPath += Date.now();
    for (let i = 0; i < 600; i++) {
        longPath += Math.floor((Math.random() * 10));
    }
    return longPath;
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
    });
}

function omniLog(text) {
    fs.appendFile("serverLog.txt", text + "\n", (err) => {
        if (err) {
            console.log("error writing omniLog");
        } else {
            console.log(`${text} Logging Complete.`);
        }
    });
}

function displayHome(path, req, res) {
    getUrlsFromDB((urls) => {
        var homeHTML = `
            <html>
                <head>
                    <link rel="stylesheet" type="text/css" href="style.css">
                    <title>URLong</title>
                </head>
            <body>
                <h1>URLong</h1>
                <h3>A URL elongator</h3>
                <!--<p>This is the root.</p>
                <p><a href="/test.html">This will serve test.html</a></p>
                <p><a href="/redirecttest">Redirect Test</a></p>
                <p><a href="/notARealPage">This link will 404</a></p>
                <p><a href="/goodbye">Goodbye</a></p>-->
                <div class="theform">
                    <form enctype="application/x-www-form-urlencoded;charset=UTF-8" action="/addurl" method="post">
                        <h3>URL to make long:</h3>
                        <input type="text" name="url"><br />
                        <button type="submit">URLongify</button>
                    </form>
                </div>
                <br />
                <hr />
                ${urls}
                <br />
                <hr />
                <p><a href="/thisisthesecretdeleteallfromthetableurl">Click to rudely delete all URLongs from the DB</a></p>
                <p>Shamefully made by <a href="https://github.com/eqmvii/urlong">eqmvii</a></p>
                </body>
        </html>
    `;
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(homeHTML);
    });
}

function urlongResults(results, path, req, res) {
    var URLongHTML = `
        <html>
            <head>
                <link rel="stylesheet" type="text/css" href="style.css">
                <title>URLonging Results</title>
            </head>
            <body>
                <script>
                function copyText() {
                    var urlongNode = document.getElementById("theurlong");
                    urlongNode.select();
                    document.execCommand("Copy");
                    // alert("Copied the text: " + urlongNode.value);
                    var statusNode = document.getElementById("statusMsg");
                    statusNode.textContent = "urlong copied to your clipboard!";
                  }
                </script>
                <h1>URLonged</h1>
                <h3>You made a URLong</h3>
                <div class="theform">
                    <p><a href="${results.urlong}">Test Your URLong</a></p>
                    <p><strong>Success:</strong> ${results.success}</p>
                    <p><strong>Msg:</strong> ${results.message}</p>
                    <p><strong>Original URL:</strong></p>
                    <p>${results.url}</p>
                    <p><strong>URLong:</strong></p>
                    <textarea type="text" id="theurlong" style="text-align: left" value="${appRoot + "/" + results.urlong}">${appRoot + "/" + results.urlong}</textarea>
                    <p><button onClick="copyText()">Copy URLong to clipboard</button></p>
                    <p id="statusMsg"></p>
                </div>
                <hr />
                <p>See you later!</p>
                <p><a href="/">Return Home</a></p>
            </body>
        </html>
        `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(URLongHTML);
}

function getUrlsFromDB(callback) {
    connection.query("SELECT * FROM urls", (err, res) => {
        if (err) {
            console.log("Error looking for URL in DB");
            serverLog("Error looking for URL in DB");
            serverLog(err);
            callback({});
            return;
        }
        console.log(`DB url results length: ${res.length}`);
        urls = '<h1>Sample Long URLS:</h1><ul style="list-style-type: none; margin: 0; padding: 0">'
        for (let i = 0; i < res.length; i++) {
            urls += `<li style="word-wrap: break-word">${appRoot}/`;
            urls += res[i].urlong;
            urls += '</li><li>^ ^ ^ ^ ^ ^ <a href="/';
            urls += res[i].urlong;
            urls += '">Test This URLong</a> ^ ^ ^ ^ ^ ^</li>';
        }
        urls += '</ul><br />';
        // urls = `<h1>Fake URLS</h1>`;
        callback(urls);
    });
}

function displayGoodbye(path, req, res) {
    var goodbyeHTML = `
    <html>
        <head>
            <link rel="stylesheet" type="text/css" href="style.css">
            <title>URLonged!</title>
        </head>
        <body>
            <h1>Thanks for making a long URL!</h1>
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
      font-size: 14px;
    }

    h1, h3, p, a, ul {
        text-align: center;
    }

    li {
        margin-bottom: 12px;
    }

    input {
        margin-top: 6px;
        margin-bottom: 4px;
        height: 1.9em;
        border-radius: 5px;
    }

    button {
        border: 1px solid blue;
        background-color: white;
        color: blue;
        border-radius: 5px;
        height: 3.5em;
        width: 20%;
        font-weight: bold;
        padding: 6px;
        margin-top: 6px;

    }

    button:hover {
        cursor: pointer;
        color: white;
        background-color: blue;
        border: 1px solid black;
    }

    .theform {
        text-align: center;
        width: 70%;
        margin-left: auto;
        margin-right: auto;
        margin-top: 6px;
        margin-bottom: 12px;
        border: 2px solid black;
        border-radius: 5px;
        word-wrap: break-word;
        padding: 12px;
    }

    #theurlong {
        width: 70%;
        height: 230px;
        word-wrap: break-word;
    }

    #statusMsg {
        height: 2em;
    }
    `;
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
            <p>I hope it's not a broken URLong!</p>
            <p>It might be :(</p>
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

function redirectTest(path, req, res) {
    res.writeHead(302, {
        'Location': '/goodbye'
    });
    res.end();
}

// Deprecated
function turnOff() {
    connection.end((err) => {
        if (err) { console.log("Error closing..."); console.log(err); }
        else { console.log(`### Connection ${connection.threadId} closed ###`); }
    });
}
