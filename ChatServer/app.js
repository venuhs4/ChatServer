var server = require('websocket').server, http = require('http');
var connections = {};
var messages = {};

var socket = new server({
    httpServer: http.createServer().listen(4444)
});

socket.on('request', function (request) {
    var connection = request.accept(null, request.origin);

    connection.on('message', function (message) {
        var data = JSON.parse(message.utf8Data);
        if (data.type == "CON") {
            connection.id = data.id;
            connections[data.id] = connection;

            if (messages[data.id] != undefined) {
                for (var i = 0; i < messages[data.id].length; i++) {
                    sendToConnectionId(data.id, messages[data.id][i]);
                }
                delete messages[data.id];
            }

        }
        else if (data.type == undefined) {
            sendToConnectionId(data.id, JSON.stringify({ senderId: connection.id, data: data.data }));
        }
        else if (data.type == "BRD") {

            broadcast(JSON.stringify({ senderId: connection.id, data: data.data }));
        }
    });

    connection.on('close', function (connection) {
        console.log('connection closed');
        for (var key in connections) {
            if (!connections[key].connected)
                delete connections[key];
        }
    });

    function broadcast(data) {
        Object.keys(connections).forEach(function (key) {
            var connection = connections[key];
            if (connection.connected) {
                connection.send(data);
            }
        });
    }

    // Send a message to a connection by its connectionID
    function sendToConnectionId(connectionID, data) {
        var connection = connections[connectionID];
        if (connection && connection.connected) {
            connection.send(data);
        }
        else {
            if (messages[connectionID] == undefined) {
                messages[connectionID] = [];
                messages[connectionID].push(data);
            }
            else {
                messages[connectionID].push(data);
            }
        }
    }
}); 