const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var furnitureStatus = [];
var currentUsers = 0;

const colors = ['blue', 'red', 'yellow', 'black', 'green', 'purple'];
app.use(express.static('public'));

function contains(array, element) {
    for (let obj of array) {
        if (obj == element) {
            return true;
        }
    }
    return false;
}

    

function addDefaultFurniture() {
    furnitureStatus.push({
        id: "button0",
        type: 'chair',
        x: '200px',
        y: '200px',
        borderList: [],
    });
    furnitureStatus.push({
        id: "button1",
        type: 'sofa',
        x: '500px',
        y: '200px',
        borderList: [],
    });
    furnitureStatus.push({
        id: "button2",
        type: 'bed',
        x: '800px',
        y: '200px',
        borderList: [],
    });
    console.log("create base furn");
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
        console.log(msg);
    });

    socket.on('addObject', (obj) => {
        var newFurn = {
            id: 'button' + furnitureStatus.length,
            type: obj.type,
            x: obj.x,
            y: obj.y,
            borderList: [],
        };
        furnitureStatus.push(newFurn);
        console.log('created object : ' + 'button' + furnitureStatus.length);
        io.emit('broadcastObject', {
            id: 'button' + furnitureStatus.length,
            type: obj.type,
            x: obj.x,
            y: obj.y,
            borderList: [],
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
        if (objId != socket.selectedFurniture) {
            //si on clique sur le meme objet, on ne veut pas briser l'ordre des bordures
            for (let obj of furnitureStatus) {
                if (obj.id == socket.selectedFurniture) {
                    var shadowIndex = obj.borderList.indexOf(socket.color);
                    obj.borderList.splice(shadowIndex, 1);
                    io.emit('broadcastUnselect', { id: socket.selectedFurniture, borderList: obj.borderList });
                    socket.selectedFurniture = '';
                }
            }

            for (let obj of furnitureStatus) {
                if (obj.id == objId) {
                    if (!contains(obj.borderList, socket.color)) {
                        socket.selectedFurniture = objId;
                        obj.borderList.push(socket.color);
                        io.emit('broadcastClick', {
                            borderList: obj.borderList,
                            id: objId,
                        });
                    }
                }
            }
        }
        
    });

    socket.on('objectUnselect', function () {
        if (socket.selectedFurniture != '') {
            for (let obj of furnitureStatus) {
                if (obj.id == socket.selectedFurniture) {
                    var shadowIndex = obj.borderList.indexOf(socket.color);
                    obj.borderList.splice(shadowIndex, 1);
                    io.emit('broadcastUnselect', { id: socket.selectedFurniture, borderList: obj.borderList });
                    socket.selectedFurniture = '';
                }
            }
        } 
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
    socket.selectedFurniture = '';
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