var ADDR = "ws://0.0.0.0:8000";
function send_msg(socket, username) {
    var message = document.getElementById("message");
    socket.send(JSON.stringify({ message: message.value, name: username }));
    message.value = ""; // clear input box
}
function write_msg(event) {
    //parse msg and timestamp
    var response = JSON.parse(event.data);
    var msg_dtime = (new Date(Number(response.received_at))).toLocaleString("en-GB");
    var messages = document.getElementById("messages");
    messages.value += "[" + msg_dtime + "] " + response.name + ": " + response.message + "\n";
}
document.addEventListener("DOMContentLoaded", function () {
    try {
        var socket = new WebSocket(ADDR);
        var name = "defaultUser"; //prompt("Username?")
        document.getElementById("username").innerText = name;
        // when clicking the button, send json message
        var sendButton = document.getElementById("send");
        sendButton.addEventListener("mousedown", function (_) {
            send_msg(socket, name);
        });
        sendButton.addEventListener("touchstart", function (_) {
            send_msg(socket, name);
        });
        // upon receiving a msg, append it to the text area
        socket.onmessage = function (event) {
            write_msg(event);
        };
    }
    catch (error) {
        alert("Unable to connect. Refresh in 10s");
    }
});
