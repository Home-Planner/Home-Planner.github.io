const furnitures = document.querySelectorAll(".furniture");

furnitures.forEach((furn) => {
  const drag = (e) => {
    furn.style.top = e.pageY + "px";
    furn.style.left = e.pageX + "px";
    furn.classList.add("redborder");
  };

 

  /*function drag(e) {

          }*/
  furn.addEventListener("mousedown", () => {
    window.addEventListener("mousemove", drag);
  });

  window.addEventListener("mouseup", () => {
    window.removeEventListener("mousemove", drag);
    furn.classList.remove("redborder");
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

mainApp.style.display = 'none';

var socket = io({ autoConnect: false });

usernameForm.addEventListener('submit', function (e) { //SUBMIT EST UN KEYWORD
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
});

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

socket.on("users", (users) => {
    users.forEach((user) => {
        user.self = user.userID === socket.id;
        //initReactiveProperties(user);
    });
    // put the current user first, and then sort by username
    this.users = users.sort((a, b) => {
        if (a.self) return -1;
        if (b.self) return 1;
        if (a.username < b.username) return -1;
        return a.username > b.username ? 1 : 0;
    });
});

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
