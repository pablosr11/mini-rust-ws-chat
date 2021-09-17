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

#[derive(Debug)]
struct Mensaje {
    name: String,
    msg: String,
    date: String,
}

impl Handler for Server {
    fn on_open(&mut self, shake: ws::Handshake) -> Result<()> {
        let pool = self.pool.clone(); // so it can be used to trigger queries
        let sender = self.out.clone();

        thread::spawn(move || {
            let conn = &pool.get().unwrap();
            let mut stmt = conn
                .prepare("SELECT name,msg,date FROM (SELECT name,msg,date FROM chat_messages ORDER BY date DESC LIMIT 5) ORDER BY date")
                .unwrap();
            let mensajes = stmt
                .query_map([], |row| {
                    Ok(Mensaje {
                        name: row.get(0)?,
                        msg: row.get(1)?,
                        date: row.get(2)?,
                    })
                })
                .unwrap();
            for me in mensajes {
                let stuff = me.unwrap();
                sender
                    .send(Message::Text(
                        json!({
                            "name": stuff.name,
                            "message": stuff.msg,
                            "received_at": stuff.date
                        })
                        .to_string(),
                    ))
                    .unwrap();
            }
        });

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
                let conn = &pool.get().unwrap();
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

    let conn = pool.get().unwrap();
    conn.execute(
        "CREATE TABLE IF NOT EXISTS chat_messages (name TEXT,msg TEXT,date TEXT)",
        [],
    )
    .unwrap();

    ws::listen(WS_ADDRESS, |out| Server {
        out,
        pool: pool.clone(),
    })
    .unwrap()
}
