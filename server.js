const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var furnitureStatus = [];
var currentUsers = 0;
var itemCounter = 0;
const colors = ['blue', 'red', 'yellow', 'black', 'green', 'purple'];
app.use(express.static('public'));

function addDefaultFurniture() {
    furnitureStatus.push({
        id: "button1",
        type: 'square',
        x: '200px',
        y: '200px',
        border: 'none',
    });
    furnitureStatus.push({
        id: "button2",
        type: 'square',
        x: '500px',
        y: '200px',
        border: 'none',
    });
    furnitureStatus.push({
        id: "button3",
        type: 'square',
        x: '800px',
        y: '200px',
        border: 'none',
    });
    console.log("create base furn");
    itemCounter = 3;
}

addDefaultFurniture();
//serverside
io.on('connection', (socket) => {
    
    console.log("user connected : " + socket.username);

    socket.emit('clearObject');

    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
        users.push({
            userID: id,
            username: socket.username,
            color: socket.color,
        });
    }
    io.emit("users", users);

    for (let obj of furnitureStatus) {
        socket.emit('broadcastObject', obj);
    }

    socket.on('consoleLog', (msg) => {
        console.log("client log: ", msg);
    });

    socket.on('addObject', (obj) => {
        var newFurn = {
            id: 'button' + itemCounter.toString(),
            type: obj.type,
            x: obj.x,
            y: obj.y,
            border: 'none',
        };
        itemCounter++;
        furnitureStatus.push(newFurn);
        console.log('created object : ' + 'button' + itemCounter.toString());
        io.emit('broadcastObject', {
            id: 'button' + itemCounter.toString(),
            type: obj.type,
            x: obj.x,
            y: obj.y,
            border: 'none',
        });
    });

    socket.on('objectRemove', (furn) => {
        var furnIndex = furnitureStatus.indexOf(furn.obj);
        furnitureStatus.splice(furnIndex, 1);
        io.emit('broadcastRemove', furn.id);
        console.log('object ' + furn.id + 'removed step 1')
    });

    socket.on('cursorMove', (mousePosition) => {
        socket.pointerX = mousePosition.x;
        socket.pointerY = mousePosition.y;
        socket.broadcast.emit('otherCursors', { color: socket.color, pointerX: socket.pointerX, pointerY: socket.pointerY });
    });

    socket.on('objectMove', (newObj) => {
        for (let obj of furnitureStatus) {
            if (obj.id == newObj.id) {
                obj.x = newObj.x;
                obj.y = newObj.y;
            }
        }
        socket.broadcast.emit('broadcastMove', {
            x: newObj.x, y: newObj.y, id: newObj.id
        });
    });

    socket.on('objectClick', (objId) => {
        for (let obj of furnitureStatus) {
            if (obj.id == objId) {
                obj.border = '10px solid ' + socket.color;
            }
        }
        io.emit('broadcastClick', { color: socket.color, objId: objId  });
    });

    socket.on('objectUnselect', (objId) => {
        for (let obj of furnitureStatus) {
            if (obj.id == objId) {
                obj.border = 'none';
            }
        }
        io.emit('broadcastUnselect', objId);
    });

    

    socket.on('disconnect', () => {//connect et disconnect sont des keyword
        //DESIGN UN SYSTEME DE REMPLACEMENT COULEUR
        console.log('user disconnected: ' + socket.username);
        colors.push(socket.color);
        currentUsers = currentUsers - 1;
    });
});

io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error("invalid username"));
    }
    socket.username = username;

    socket.color = colors[0];
    colors.splice(0, 1);
    socket.pointerX = -1;
    socket.pointerY = -1;
    currentUsers = currentUsers + 1;
    next();
});

server.listen(3000, () => {//port
    console.log('CTRL+C to exit');
});