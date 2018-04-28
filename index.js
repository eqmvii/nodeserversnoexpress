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

appColor = "blue";


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
} else {
    connection = mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password", // so secure I know
        database: "urlong_db"
    });
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
    appRoot = request.headers.host;
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
            if (path === "/color") {
                console.log("It was a color push!");
                console.log(body);
                console.log("^ that was the body ^ ");
                var newColor = body.split("=")[1];
                appColor = newColor;
                response.writeHead(302, {
                    'Location': '/'
                });
                response.end();
            } else {
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
            }
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
                    case "/admin":
                        displayAdmin(path, request, response);
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
    var charArray = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWYX1234567890';
    var longPath = "";
    if (shortPath.length > 1000) {
        console.log("Woah that's already crazy long");
        return longPath + Date.now() + shortPath;
    }
    for (let i = 0; i < 400; i++) {
        longPath += charArray[Math.floor((Math.random() * charArray.length))];
    }
    longPath += `url`;
    longPath += Date.now();
    for (let i = 0; i < 1100; i++) {
        longPath += charArray[Math.floor((Math.random() * charArray.length))];
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
                    <!-- fix transition bug by keeping pre-transition styles in the html -->
                    <style>
                    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700&effect=3d-float');
                    .urlongtile {
                        font-family: monospace;
                        font-size: 14px;

                        width: 50%;
                        border: 1px solid gray;
                        border-radius: 5px;
                        padding: 8px;
                        line-height: 1.4em;
                        max-height: 2.4em;
                        overflow: hidden;

                        margin-bottom: 12px;
                        margin-right: auto;
                        margin-left: auto;

                        box-shadow: 1px 1px gray;

                        word-wrap: break-word;

                        transition: 0.2s linear;
                    }
                    .urlongtile a {
                        text-decoration: none;
                        color: black;
                    }
                    </style>
                    <link rel="stylesheet" type="text/css" href="style.css">
                    <title>URLong</title>
                </head>
            <body>
                <div id="pagewrapper">
                    <h1 class="font-effect-3d-float" style="font-family: 'Source Sans Pro', sans-serif; color: firebrick;">URLong</h1>
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
                    ${urls}
                    <br />
                    <hr />
                    <p>Shamefully made by <a href="https://github.com/eqmvii/urlong">eqmvii</a></p>
                    <br />
                    <hr />
                    <div style="text-align: center;">
                        <h3>Change page color</h3>
                        <form id="colorform" name="colorform" action="/color" method="post">
                            <select id="colorselect" name="color">
                                <option value="blue">Blue</option>
                                <option value="green">Green</option>
                                <option value="black">Black</option>
                            </select>
                            <br />
                            <button type="submit">Change Color</button>
                        </form>
                    </div>
                    <br />
                    <hr />
                </div>
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
                <style>
                    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700&effect=fire-animation');
                </style>
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
                <div id="pagewrapper">
                    <h1 style="font-family: 'Source Sans Pro', sans-serif; color: lightslategray;" class="font-effect-fire-animation">You made a URLong</h1>
                    <div class="theform">
                        <p><a href="${results.urlong}">Test Your URLong</a></p>
                        <p><strong>Success:</strong> ${results.success}</p>
                        <p><strong>Msg:</strong> ${results.message}</p>
                        <p><strong>Original URL:</strong></p>
                        <p>${results.url}</p>
                        <p><strong>URLong:</strong></p>
                        <textarea type="text" id="theurlong" style="text-align: left" value="${req.headers.host + "/" + results.urlong}">${req.headers.host + "/" + results.urlong}</textarea>
                        <p><button onClick="copyText()">Copy URLong to clipboard</button></p>
                        <p id="statusMsg"></p>
                    </div>
                    <br />
                    <p>See you later!</p>
                    <p><a href="/">Return Home</a></p>
                </div>
            </body>
        </html>
        `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(URLongHTML);
}

// TODO: Pass this request to avoid needing to use a global variable for appRoot?
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

        urls = '<h1>Sample Long URLS:</h1>'
        for (let i = 0; i < res.length; i++) {
            urls += `<div class="urlongtile"><a href="http://${appRoot}/`;
            urls += res[i].urlong;
            urls += `">http://${appRoot}/${res[i].urlong}</a></div>`;
        }
        urls += '<br />';
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
            <div id="pagewrapper">
                <h1>Thanks for making a long URL!</h1>
                <p>See you later!</p>
                <p><a href="/">Return Home</a></p>
            </div>
        </body>
    </html>
    `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(goodbyeHTML);
}

function displayAdmin(path, req, res) {
    var adminHTML = `
    <html>
        <head>
            <link rel="stylesheet" type="text/css" href="style.css">
            <title>Admin</title>
        </head>
        <body>
            <div id="pagewrapper">
                <h1>Admin</h1>
                <p><a href="/thisisthesecretdeleteallfromthetableurl">Click to rudely delete all URLongs from the DB</a></p>
                <p><a href="/">Return Home</a></p>
            </div>
        </body>
    </html>
    `;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(adminHTML);
}

function sendStyles(path, req, res) {
    var styles = `
    body {
      color: ${appColor};
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
        border: 1px solid ${appColor};
        background-color: white;
        color: ${appColor};
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
        background-color: ${appColor};
        border: 1px solid black;
    }

    .theform {
        text-align: center;
        width: 80%;
        margin-left: auto;
        margin-right: auto;
        margin-top: 6px;
        margin-bottom: 20px;
        border: 2px solid black;
        border-radius: 5px;
        word-wrap: break-word;
        padding: 12px;
    }

    .urlongtile:hover {
        max-height: 26em;
        width: 100%;
        box-shadow: 2px 2px ${appColor};

        margin-top: 16px;
        margin-bottom: 20px;

        font-size: 20px;
    }

    #theurlong {
        width: 80%;
        height: 230px;
        word-wrap: break-word;
    }

    #statusMsg {
        height: 2em;
    }

    #pagewrapper {
        padding-top: 8px;
        padding-bottom: 8px;
        margin-left: auto;
        margin-right: auto;
        max-width: 960px;
    }

    #colorselect {
        width: 10%;
        height: 2em;
        border-radius: 5px;
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

// TODO: Add modals?

// TODO: Make admin have a delete one-by-one page?

// TODO: Auth for admin?

// TODO: Cleanup user input/URL santization and parsing
