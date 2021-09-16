const WS_ADDRS = "ws://0.0.0.0:8000"

function send_msg(socket: WebSocket, username: string): void {
    const message = <HTMLInputElement>document.getElementById("message");
    socket.send(JSON.stringify({ message: message.value, name: username }))
    message.value = ""; // clear input box
}

function write_msg(event): void {
    //parse msg and timestamp
    const response = JSON.parse(event.data);
    const msg_dtime: string = (new Date(Number(response.received_at))).toLocaleString("en-GB")
    const messages = <HTMLTextAreaElement>document.getElementById("messages");
    messages.value += `[${msg_dtime}] ${response.name}: ${response.message}\n`;

}

document.addEventListener("DOMContentLoaded", function () {
    try {
        const socket: WebSocket = new WebSocket(WS_ADDRS)

        const name: string = "defaultUser" //prompt("Username?")
        document.getElementById("username").innerText = name;

        // when clicking the button, send json message
        const sendButton = <HTMLButtonElement>document.getElementById("send");
        sendButton.addEventListener("mousedown", (_) => {
            send_msg(socket, name);
        })
        sendButton.addEventListener("touchstart", (_) => {
            send_msg(socket, name);
        })

        // upon receiving a msg, append it to the text area
        socket.onmessage = function (event) {
            write_msg(event)
        };

    } catch (error) {
        alert("Unable to connect. Refresh in 10s")
    }
});







