const furnitures = document.querySelectorAll(".furniture");
const furnitureType = ['chair', 'bed', 'sofa'];
var justClickedObject = false;
var currentTool;
var main = document.getElementById("main");

$('#toolbar-furniture').toolbar({
    content: '#toolbar-options',
    position: 'left',
});

function randInt(bound) {
    return Math.floor(Math.random() * bound);
}
//BUTTON ACTIONS

function createObject(furn) {
    socket.emit('addObject', {
        type: furn,
        x: '700px',
        y: '350px',
    });
}

function activateTool(tool) {
    console.log('activate tool: ' + tool);
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



var socket = io();//{ autoConnect: false }//main.style.display = 'none';
//BLOCK POUR ID FLEMME
usernameForm.style.display = 'none';
socket.auth = { username: 'User' + randInt(10).toString() };
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
        main.style.display = 'block';
        isConnected = true;
    }
});*/

document.onmousemove = function (event) {
    if (isConnected) {
        pointerX = event.pageX;
        pointerY = event.pageY;
        if (mouseCanvas.getContext) {

        }
        socket.emit('cursorMove', { x: pointerX, y: pointerY });
    }
}
    

socket.on("connect_error", (err) => {
    if (err.message === "invalid username") {
        console.log("erreur on verra plus tar");
    }
});

socket.on('otherCursors', (cursorInfo) => {
    mouseCtx.fillStyle = cursorInfo.color;
    mouseCtx.clearRect(0, 0, 3000, 3000);
    mouseCtx.fillRect(cursorInfo.pointerX, cursorInfo.pointerY, 7, 7);
});

socket.on('broadcastClick', (obj) => {
    var furn = document.getElementById(obj.id);
    var buffer = '';
        
    for (var i = 0; i < obj.borderList.length - 1; i++) {
        buffer += '0 0 0 ' + ((i + 1) * 4).toString() + 'px ' + obj.borderList[i] + ',';
    }
    if(obj.borderList.length > 0)
        buffer += '0 0 0 ' + (obj.borderList.length * 4).toString() + 'px ' + obj.borderList[obj.borderList.length - 1];
    furn.style.boxShadow = buffer;
    //socket.emit('consoleLog', 'buffer :' + buffer);
    //socket.emit('consoleLog', 'boxshadow :' + furn.style.boxShadow);
});

var furnList = [];

socket.on('broadcastObject', (obj) => {
    var newFurn = document.createElement("button");
    furnList.push(obj.id);
    newFurn.setAttribute("id", obj.id);
    newFurn.setAttribute("class", "furniture " + obj.type);
    newFurn.style.left = obj.x;
    newFurn.style.top = obj.y;
    var buffer = '';

    for (var i = 0; i < obj.borderList.length - 1; i++) {
        buffer += '0 0 0 ' + ((i + 1) * 4).toString() + 'px ' + obj.borderList[i] + ',';
    }
    if (obj.borderList.length > 0)
        buffer += '0 0 0 ' + (obj.borderList.length * 4).toString() + 'px ' + obj.borderList[obj.borderList.length - 1];
    newFurn.style.boxShadow = buffer;
    main.appendChild(newFurn);

    const drag = (e) => {
        if (currentTool == 'hand') {
            newFurn.style.top = e.pageY + "px";
            newFurn.style.left = e.pageX + "px";
            socket.emit("objectMove", { id: newFurn.id, x: newFurn.style.left, y: newFurn.style.top });
        }  
    };

    newFurn.addEventListener("mousedown", () => {
        justClickedObject = true;
        //hand
        if (currentTool == 'bin') {
            socket.emit('objectRemove', { obj: newFurn, id: newFurn.id });
            socket.emit('consoleLog', 'attempted removal');
        } else {
            window.addEventListener("mousemove", drag);
            socket.emit("objectClick", newFurn.id); //plus tard on utilisera des ombres d'images jpense
        }
        //bin
        
    });

    window.addEventListener("mouseup", () => {
        window.removeEventListener("mousemove", drag);
    });
});

document.onmousedown = function (event) {
    if (!justClickedObject) {
        socket.emit('consoleLog', "clicked off");
        socket.emit('objectUnselect');
    }
    justClickedObject = false;
}

socket.on('broadcastUnselect', (obj) => {
    var furn = document.getElementById(obj.id);
    var buffer = '';
    socket.emit('consoleLog', 'del bordersize :' + obj.borderList.length);
    for (var i = 0; i < obj.borderList.length - 1; i++) {
        buffer += '0 0 0 ' + ((i + 1) * 4).toString() + 'px ' + obj.borderList[i] + ',';
    }
    if (obj.borderList.length > 0)
        buffer += '0 0 0 ' + (obj.borderList.length * 4).toString() + 'px ' + obj.borderList[obj.borderList.length - 1];
    furn.style.boxShadow = buffer;
});
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
    this.users = users.sort((a, b) => {
        if (a.self) return -1;
        if (b.self) return 1;
        if (a.username < b.username) return -1;
        return a.username > b.username ? 1 : 0;
    });

    userList.innerHTML = 'Utilisateurs :<br>\n';
    users.forEach((user) => {
        user.self = user.userID === socket.id;
        var string = '<p style="color:' + user.color + '; font-weight:bold;">' + user.username + '</p>\n';
        
        userList.innerHTML += string;
    });
    // put the current user first, and then sort by username
    
});
