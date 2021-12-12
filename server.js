const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var currentUsers = 0;
const colors = ['blue', 'red', 'yellow', 'black', 'green', 'purple'];
app.use(express.static('public'));

//serverside
io.on('connection', (socket) => {

    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
        users.push({
            userID: id,
            username: socket.username,
        });
    }
    socket.emit("users", users);

    socket.on('consoleLog', (msg) => {
        console.log("client log: ", msg);
    });

    socket.on('cursorMove', (mousePosition) => {
        socket.pointerX = mousePosition.x;
        socket.pointerY = mousePosition.y;
        socket.broadcast.emit('otherCursors', { color: socket.color, pointerX: socket.pointerX, pointerY: socket.pointerY });
    });

    socket.on('objectMove', (obj) => {
        socket.broadcast.emit('broadcastMove', {
            x: obj.x, y: obj.y, objId: obj.objId
        });
    });

    socket.on('objectClick', (objId) => {
        console.log('sent server id :' + objId);
        io.emit('broadcastClick', { color: socket.color, objId: objId  });
    });

    socket.on('objectUnselect', (objId) => {
        io.emit('broadcastUnselect', objId);
    });

    io.emit("user connected", socket.username);

    socket.on('disconnect', () => {//connect et disconnect sont des keyword
        //DESIGN UN SYSTEME DE REMPLACEMENT COULEUR
        console.log('user disconnected');
        currentUsers = currentUsers - 1;
    });
});

io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error("invalid username"));
    }
    socket.username = username;
    socket.color = colors[currentUsers];
    console.log("socket.color : " + socket.color);
    socket.pointerX = -1;
    socket.pointerY = -1;
    console.log("handshake1 : " + currentUsers.toString());
    currentUsers = currentUsers + 1;
    console.log("handshake2 : " + currentUsers.toString());
    next();
});

server.listen(3000, () => {//port
    console.log('CTRL+C to exit');
});