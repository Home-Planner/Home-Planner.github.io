const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var users = [];
var furnitureStatus = [];
var ghostList = [];
var currentUsers = 0;
var objectCounter = 0;
const colors = ['blue', 'red', 'green'];
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
    objectCounter = 2;
}

addDefaultFurniture();
//serverside
io.on('connection', (socket) => {
    
    console.log("user connected : " + socket.username);

    users.push({
        userID: socket.username,
        username: socket.username,
        color: socket.color,
        tool: socket.tool,
    });

    io.emit("users", users);
    socket.emit('clearObject');

    socket.on('updateTool', (updateTool) => {
        var indexBuffer = -1;
        for (let user of users) {
            if (socket.username == user.userID) {
                indexBuffer = users.indexOf(user);
            }
                
        }

        switch (updateTool) {
            case 'hand':
                users[indexBuffer].tool = "far fa-hand-paper";
                break;
            case 'hammer':
                users[indexBuffer].tool = "fas fa-hammer";
                break;
            case 'brush':
                users[indexBuffer].tool = "fas fa-paint-brush";
                break;
            case 'bin':
                users[indexBuffer].tool = "fas fa-trash";
                break;
            default:
                break;
        }
        io.emit("users", users);
    });
        


    for (let obj of furnitureStatus) {
        socket.emit('broadcastObject', obj);
    }

    for (let ghost of ghostList) {
        socket.emit('broadcastGhost', ghost);
    }

    socket.on('consoleLog', (msg) => {
        console.log(msg);
    });

    
    socket.on('addObject', (obj) => {
        objectCounter++;
        var newFurn = {
            id: 'button' + objectCounter.toString(),
            type: obj.type,
            x: obj.x,
            y: obj.y,
            borderList: [],
        };
        furnitureStatus.push(newFurn);
        io.emit('broadcastObject', furnitureStatus[furnitureStatus.length - 1]);
    });

    socket.on('createGhost', (obj) => {

        var indexBuffer = -1;
        for (var i = 0; i < ghostList.length; i++) {
            if (ghostList[i].color == socket.color) {
                indexBuffer = i;
                break;
            }
        }
        if (indexBuffer > -1) {
            io.emit('removeGhost', ghostList[indexBuffer].originalId);
            ghostList.splice(indexBuffer, 1);
        }
            
        ghostList.push({
            originalId: obj.id,
            type: obj.type,
            x: obj.x,
            y: obj.y,
            color: socket.color,
        });
        io.emit('broadcastGhost', ghostList[ghostList.length - 1]);
    });

    socket.on('forceUnselectAll', (objId) => {
        io.emit('ownershipCheck1', objId);
    });

    socket.on('ownershipCheck2', (objId) => {
        if (socket.selectedFurniture == objId) {
            socket.selectedFurniture = '';
        } 
    });

    socket.on('objectRemove', (objId) => {
        var furnIndex = -1;
        for (var i = 0; i < furnitureStatus.length; i++) {
            if (furnitureStatus[i].id == objId) {
                furnIndex = i;
                break;
            }
        }
        furnitureStatus.splice(furnIndex, 1);
        io.emit('broadcastRemove', objId);
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
        socket.broadcast.emit("broadcastGhost", )
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
        var indexBuffer = -1;
        for (let user of users) {
            if (socket.id == user.userID)
                indexBuffer = users.indexOf(user);
        }
        users.splice(indexBuffer, 1);
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
    socket.tool = 'none';
    socket.color = colors[0];
    colors.splice(0, 1);
    socket.pointerX = -1;
    socket.pointerY = -1;
    currentUsers = currentUsers + 1;
    next();
});

server.listen(3000, () => {//port
});