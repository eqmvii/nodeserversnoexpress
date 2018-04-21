var http = require("http");

const PORT_ONE = 3000;
const PORT_TWO = 4000;

// Callback handling the request from the server and logging the URL hit
function handleRequestPortOne(request, response) {
  response.end(`Server One works! Path: ${request.url}`);
}

function handleRequestPortTwo(request, response) {
    response.end(`Server Two works! Path: ${request.url}`);
  }

var serverOne = http.createServer(handleRequestPortOne);
var serverTwo = http.createServer(handleRequestPortTwo);


serverOne.listen(PORT_ONE, function() {
  console.log(`Server #1 is up and listening: http://localhost: ${PORT_ONE}`);
});

serverTwo.listen(PORT_TWO, function() {
  console.log(`Server #2 is up and listening: http://localhost: ${PORT_TWO}`);
});

