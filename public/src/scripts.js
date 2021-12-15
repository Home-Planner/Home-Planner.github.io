const furnitures = document.querySelectorAll(".furniture");
const furnitureType = ['chair', 'bed', 'sofa'];
var justClickedObject = false;
var objectWasMoved = true;
var ghostPosition = [];
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
    socket.emit('updateTool', tool);
}

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
socket.auth = { username: 'User' + randInt(10000).toString() };
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

activateTool('hand');
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
            objectWasMoved = true;
        }  
    };

    newFurn.addEventListener("mousedown", () => {
        justClickedObject = true;
        //hand
        socket.emit('consoleLog', 'hit object :' + newFurn.id);
        if (currentTool == 'bin') {
            socket.emit('forceUnselectAll', newFurn.id);
            socket.emit('objectRemove', newFurn.id);
        } else {
            window.addEventListener("mousemove", drag);
            ghostPosition = {
                id: newFurn.id,
                type: obj.type,
                x: newFurn.style.left,
                y: newFurn.style.top,
            }
            socket.emit("objectClick", newFurn.id); //plus tard on utilisera des ombres d'images jpense
            window.addEventListener("mouseup", () => {
                window.removeEventListener("mousemove", drag);
                if (objectWasMoved
                    ) {
                    //Math.abs(ghostPosition.x - newFurn.style.left) > 100 &&
                    //Math.abs(ghostPosition.y - newFurn.style.top) > 100
                        socket.emit('consoleLog', 'ghost enter' + newFurn.id);
                    socket.emit('createGhost', {
                        
                        id: ghostPosition.id,
                        type: ghostPosition.type,
                        x: ghostPosition.x,
                        y: ghostPosition.y,
                    });
                    
                }
            });
        }
        //bin
        objectWasMoved = false;
    });

    
});

socket.on('broadcastGhost', (ghost) => {
    var newFurn = document.createElement("button");
    newFurn.setAttribute("id", "ghost" + ghost.originalId);
    newFurn.setAttribute("disabled", true);
    newFurn.style.backgroundColor = ghost.color;
    newFurn.setAttribute("class", "ghost " + ghost.type);
    newFurn.style.left = ghost.x;
    newFurn.style.top = ghost.y;

    main.appendChild(newFurn);

    var originalFurn = document.getElementById(ghost.originalId);
    originalFurn.style.backgroundColor = ghost.color;
});

socket.on('removeGhost', (objId) => {
    var originalFurn = document.getElementById(objId);
    originalFurn.style.backgroundColor = '#ccc';

    var ghost = document.getElementById('ghost' + objId);
    ghost.remove();
})

socket.on('ownershipCheck1', (objId) => {
    socket.emit('ownershipCheck2', objId);
});

document.onmousedown = function (event) {
    if (!justClickedObject) {
        socket.emit('objectUnselect');
    }
    justClickedObject = false;
}

socket.on('broadcastUnselect', (obj) => {
    var furn = document.getElementById(obj.id);
    var buffer = '';
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

var ULBuffer = '';
var userList = document.getElementById("textUL");

socket.on("users", (users) => {

    userList.innerHTML = 'Utilisateurs :<br>\n';
    users.forEach((user) => {
        user.self = user.userID === socket.id;
        var string = '<p style="color:' + user.color + '; font-weight:bold;">' + user.username + '</p> + <i class="' + user.tool + '"></i>\n';
        userList.innerHTML += string;
    });
    // put the current user first, and then sort by username
    
});
