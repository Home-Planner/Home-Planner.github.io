const furnitures = document.querySelectorAll(".furniture");
var ownedFurniture = null;
var justClickedObject = false;
var currentTool;

//BUTTON ACTIONS
document.onmousedown = function (event) {
    if (ownedFurniture != null && !justClickedObject) {
        socket.emit('objectUnselect', ownedFurniture.id);
        ownedFurniture = null;
        console.log("mouseDown");
    }
    justClickedObject = false;
}

function createObject() {
    socket.emit('addObject', {
        type: 'square',
        x: '700px',
        y: '350px',
    });
}

function activateTool(tool) {
    var main = document.getElementById("main");
    currentTool = tool;
    switch (tool) {
        case 'hand':
            main.style.cursor = 'grab';
            break;
        case 'hammer':
            main.style.cursor = 'url("res/hammer.cur"), auto';
            break;
        case 'brush':
            main.style.cursor = 'url("res/brush.cur"), auto';
            break;
        case 'bin':
            main.style.cursor = 'url("res/bin.cur"), auto';
            console.log('activate bin');
            break;
        default:
            break;
    }
}
activateTool('hand');
var pointerX = -1;
var pointerY = -1;
var isConnected = false; //placeholder

var mouseCanvas = document.getElementById('mouseCanvas');
var mouseCtx = mouseCanvas.getContext('2d');

var username = document.getElementById("username");
var usernameForm = document.getElementById("usernameForm");
var usernameBlock = document.getElementById("usernameSelect");
var mainApp = document.getElementById("mainApp");



var socket = io();//{ autoConnect: false }//mainApp.style.display = 'none';
var idnumber = Math.floor(Math.random() * 10);
//BLOCK POUR ID FLEMME
usernameForm.style.display = 'none';
socket.auth = { username: 'User' + idnumber.toString() };
socket.connect();
isConnected = true;
/*usernameForm.addEventListener('submit', function (e) { //SUBMIT EST UN KEYWORD
    console.log('event happened');
    e.preventDefault();
    if (username.value) {
        socket.auth = { username: username.value };
        socket.connect();
        socket.emit('consoleLog', username.value);
        usernameBlock.style.display = 'none';
        mainApp.style.display = 'block';
        isConnected = true;
    }
});*/

document.onmousemove = function (event) {
    if (isConnected) {
        pointerX = event.pageX;
        pointerY = event.pageY;
        if (mouseCanvas.getContext) {
            /*ctx.strokeRect(50, 50, 50, 50);*/
            /*ctx.fillStyle = 'blue';
            ctx.clearRect(0, 0, 3000, 3000);
            ctx.fillRect(pointerX, pointerY, 5, 5);*/
        }
        socket.emit('cursorMove', { x: pointerX, y: pointerY });
    }
}

/*var messages = document.getElementById('messages');
var form = document.getElementById('form');
var inputMessage = document.getElementById('inputMessage');

form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (inputMessage.value) {
        socket.emit('chat message', inputMessage.value);
        inputMessage.value = '';
    }
});*/

/// SOCKET ACTIONS
    

socket.on("connect_error", (err) => {
    if (err.message === "invalid username") {
        console.log("erreur on verra plus tar");
    }
});

socket.on('otherCursors', (cursorInfo) => {
    mouseCtx.fillStyle = cursorInfo.color;
    mouseCtx.clearRect(0, 0, 3000, 3000);
    mouseCtx.fillRect(cursorInfo.pointerX, cursorInfo.pointerY, 5, 5);
    //socket.emit('consoleLog', 'drawing other cursors');
});

socket.on('broadcastClick', (obj) => {
    console.log(obj.color);
    var furn = document.getElementById(obj.objId);
    //console.log('received client id :' + obj.objId);
    
    furn.style.border = '10px solid ' + obj.color;
});

var furnList = [];

socket.on('broadcastObject', (obj) => {
    var newFurn = document.createElement("button");
    furnList.push(obj.id);
    newFurn.setAttribute("id", obj.id);
    newFurn.setAttribute("class", "furniture");
    newFurn.style.left = obj.x;
    newFurn.style.top = obj.y;
    newFurn.style.border = obj.border;
    mainApp.appendChild(newFurn);

    const drag = (e) => {
        if (currentTool == 'hand') {
            newFurn.style.top = e.pageY + "px";
            newFurn.style.left = e.pageX + "px";
            socket.emit("objectMove", { id: newFurn.id, x: newFurn.style.left, y: newFurn.style.top });
        }  
    };

    newFurn.addEventListener("mousedown", () => {
        justClickedObject = true;
        if (ownedFurniture != null) {
            socket.emit('objectUnselect', ownedFurniture.id);
        }
        ownedFurniture = newFurn;
        //hand
        window.addEventListener("mousemove", drag);
        socket.emit('consoleLog', 'clicked on : ' + newFurn.id);
        socket.emit("objectClick", newFurn.id); //plus tard on utilisera des ombres d'images jpense
        //bin
        if (currentTool == 'bin') {
            socket.emit('objectRemove', { obj: newFurn, id: newFurn.id });
            socket.emit('consoleLog', 'attempted removal');
        }
    });

    window.addEventListener("mouseup", () => {
        window.removeEventListener("mousemove", drag);
    });
});


socket.on('broadcastUnselect', (objId) => {
    var furn = document.getElementById(objId);
    furn.style.border = 'none';
})
socket.on('broadcastMove', (obj) => {
    var furn = document.getElementById(obj.id);
    furn.style.left = obj.x;
    furn.style.top = obj.y;
});

socket.on('broadcastRemove', (objId) => {
    console.log('object ' + objId + 'removed step 2');
    var furn = document.getElementById(objId);
    furn.remove();
    
});

socket.on('clearObject', function () {
    var furnBuffer;
    for (let id of furnList) {
        furnBuffer = document.getElementById(id);
        furnBuffer.remove();
    }
});
var userList = document.getElementById("textUL");
socket.on("users", (users) => {
    userList.innerHTML = 'Utilisateurs :<br>\n';
    users.forEach((user) => {
        user.self = user.userID === socket.id;
        var string = '<p style="color:' + user.color + '; font-weight:bold;">' + user.username + '</p>\n';
        
        userList.innerHTML += string;
    });
    // put the current user first, and then sort by username
    this.users = users.sort((a, b) => {
        if (a.self) return -1;
        if (b.self) return 1;
        if (a.username < b.username) return -1;
        return a.username > b.username ? 1 : 0;
    });
});

function draw() {
    ctx.clearRect(0, 0, 1920, 1080);
}
