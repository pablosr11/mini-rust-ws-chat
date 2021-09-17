var WS_ADDRS = "ws://0.0.0.0:8000";
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
var getProvider = function () {
    if ("solana" in window) {
        var provider = window.solana;
        if (provider.isPhantom) {
            window.solana.connect();
            window.solana.on("connect", function () {
                var c = document.getElementById("wallet");
                c.innerText = "Connected";
                c.disabled = true;
                username = window.solana.publicKey.toString().slice(0, 5);
                document.getElementById("username").innerText = username;
            });
            return provider;
        }
    }
    window.open("https://phantom.app/", "_blank");
};
var socket = new WebSocket(WS_ADDRS);
var username = "defaultUser"; //prompt("Username?")
document.getElementById("username").innerText = username;
// when clicking the button, send json message
var sendButton = document.getElementById("send");
sendButton.addEventListener("mousedown", function (_) {
    send_msg(socket, username);
});
sendButton.addEventListener("touchstart", function (_) {
    send_msg(socket, username);
});
// upon receiving a msg, append it to the text area
socket.onmessage = function (event) {
    write_msg(event);
};
var walletButton = document.getElementById("wallet");
walletButton.addEventListener("click", getProvider);
