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
const getProvider = () => {
    if ("solana" in window) {
        const provider = (<any>window).solana;
        if (provider.isPhantom) {
            (<any>window).solana.connect();
            (<any>window).solana.on("connect", () => {
                let c = <HTMLButtonElement>document.getElementById("wallet");
                c.innerText = "Connected";
                c.disabled = true;
                username = (<any>window).solana.publicKey.toString().slice(0, 5)
                document.getElementById("username").innerText = username
            })
            return provider;
        }
    }
    window.open("https://phantom.app/", "_blank");
};

const socket: WebSocket = new WebSocket(WS_ADDRS)

let username: string = "defaultUser" //prompt("Username?")
document.getElementById("username").innerText = username;

// when clicking the button, send json message
const sendButton = <HTMLButtonElement>document.getElementById("send");
sendButton.addEventListener("mousedown", (_) => {
    send_msg(socket, username);
})
// phone support
sendButton.addEventListener("touchstart", (_) => {
    send_msg(socket, username);
})

// upon receiving a msg, append it to the text area
socket.onmessage = function (event) {
    write_msg(event)
};

const walletButton = <HTMLButtonElement>document.getElementById("wallet");
walletButton.addEventListener("click", getProvider);

document.addEventListener("keyup", (e) => {
    if (e.code === "Enter") {
        send_msg(socket, username);
    }
})


