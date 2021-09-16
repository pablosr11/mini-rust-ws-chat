const WebSocket = require('ws');
const socket = new WebSocket("ws://127.0.0.1:8000")

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

async function init() {
    console.log(1);
    await sleep(1000);
    for (let i = 0; i < 1000; i++) {
        await sleep(10)
        socket.send(JSON.stringify({ message: makeid(7), name: "perico" }))
    }
    console.log(2);
  }

init()