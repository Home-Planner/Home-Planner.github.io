const furnitures = document.querySelectorAll(".furniture");
var ownedFurniture = null;
var justClickedObject = false;

document.onmousedown = function (event) {
    if (ownedFurniture != null && !justClickedObject) {
        socket.emit('objectUnselect', ownedFurniture.id);
        ownedFurniture = null;
        console.log("mouseDown");
    }
    justClickedObject = false;
}

furnitures.forEach((furn) => {
  const drag = (e) => {
    furn.style.top = e.pageY + "px";
      furn.style.left = e.pageX + "px";
      socket.emit("objectMove", { objId: furn.id, x: furn.style.left, y: furn.style.top });
    //furn.classList.add("redborder");
  };

 

  /*function drag(e) {

          }*/
    furn.addEventListener("mousedown", () => {
      justClickedObject = true;
      window.addEventListener("mousemove", drag);
      console.log('sent client id :' + furn.id);
        if (ownedFurniture != null) {
            socket.emit('objectUnselect', ownedFurniture.id);
        }
      ownedFurniture = furn;
      socket.emit("objectClick", furn.id); //plus tard on utilisera des ombres d'images jpense
  });

  window.addEventListener("mouseup", () => {
    window.removeEventListener("mousemove", drag);
    //furn.classList.remove("redborder");
  });
});


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
console.log(Math.floor(Math.random() * 10));
usernameForm.style.display = 'none';
socket.auth = { username: 'bruddah' + idnumber.toString() };
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

socket.on('broadcastUnselect', (objId) => {
    var furn = document.getElementById(objId);
    furn.style.border = 'none';
})
socket.on('broadcastMove', (obj) => {
    var furn = document.getElementById(obj.objId);
    furn.style.left = obj.x;
    furn.style.top = obj.y;
});

var userList = document.getElementById("textUL");
socket.on("users", (users) => {
    userList.innerHTML = '';
    users.forEach((user) => {
        user.self = user.userID === socket.id;
        userList.innerHTML += user.username + "<br>";
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
/*socket.on("user connected", (user) => {
    socket.emit('chat message', user + ' just connected');
    this.users.push(user);
});

socket.on('chat message', function (msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});*/
