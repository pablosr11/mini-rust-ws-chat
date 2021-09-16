use r2d2::{self, Pool};
use r2d2_sqlite::SqliteConnectionManager;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};
use ws::{self, Handler, Message, Result, Sender};

const WS_ADDRESS: &str = "127.0.0.1:8000";

#[derive(Serialize, Deserialize)]
struct JSONMsg {
    name: String,
    message: String,
}

struct Server {
    out: Sender,
    pool: Pool<SqliteConnectionManager>,
}

impl Handler for Server {
    fn on_open(&mut self, shake: ws::Handshake) -> Result<()> {
        println!(
            "new conn from {:?} - origin {:?}",
            shake.peer_addr,
            shake.request.origin()?
        );
        Ok(())
    }

    fn on_message(&mut self, msg: Message) -> Result<()> {
        let msg_text = msg.as_text().unwrap();
        if let Ok(json_msg) = serde_json::from_str::<JSONMsg>(msg_text) {
            println!("Received {} by {};", json_msg.message, json_msg.name);

            let current_time = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("Couldn't calculate current time")
                .as_millis()
                .to_string();

            let output_msg = json!({
                "name": json_msg.name,
                "message": json_msg.message,
                "received_at": current_time
            });

            let pool = self.pool.clone();
            thread::spawn(move || {
                let conn = pool.get().unwrap();
                conn.execute(
                    "INSERT INTO chat_messages (name,msg,date) values (?,?,?)",
                    [json_msg.name, json_msg.message, current_time],
                )
                .unwrap()
            });

            self.out.broadcast(Message::Text(output_msg.to_string()))?
        } else {
            println!("erorr at the disco - {:?}", msg_text);
        }
        Ok(())
    }
}

fn main() {
    let manager = SqliteConnectionManager::file("file.db");
    let pool = r2d2::Pool::builder().build(manager).unwrap();

    ws::listen(WS_ADDRESS, |out| Server {
        out,
        pool: pool.clone(),
    })
    .unwrap()
}
