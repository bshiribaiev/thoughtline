use rusqlite::Connection;
use rusqlite::OptionalExtension;

pub fn init_db(path: &std::path::Path) -> Result<(Connection, String), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute("PRAGMA journal_mode=WAL;", [])?;
    create_tables(&conn)?;
    let device_id = ensure_device_id(&conn)?;
    Ok((conn, device_id))
}

fn ensure_device_id(conn: &Connection) -> Result<String, rusqlite::Error> {                                                 
    let existing = conn
        .query_row(                                                                         
            "SELECT value FROM device_state WHERE key = 'device_id'",
            [],                                                                             
            |row| row.get(0),                                                               
        )
        .optional()?;

    if let Some(id) = existing {
        return Ok(id);
    }

    let id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO device_state (key, value) VALUES ('device_id', ?1)",
        [&id],
    )?;
    Ok(id)
}

fn create_tables(conn: &Connection) -> Result<(), rusqlite::Error> {
    create_ops_local(conn)?;
    create_outbox(conn)?;
    create_notes_mv(conn)?;
    create_apply_log(conn)?;
    create_device_state(conn)?;
    Ok(())
}

fn create_ops_local(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS ops_local (
            op_id       TEXT PRIMARY KEY,
            device_id   TEXT NOT NULL,
            hlc_ms      INTEGER NOT NULL,
            hlc_counter INTEGER NOT NULL,
            entity_id   TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            op_type     TEXT NOT NULL,
            payload     TEXT NOT NULL,
            schema_v    INTEGER NOT NULL DEFAULT 1
        )",
        [],
    )?;
    Ok(())
}

fn create_outbox(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS outbox (
            op_id         TEXT PRIMARY KEY REFERENCES ops_local(op_id),
            state         TEXT NOT NULL DEFAULT 'pending',
            attempts      INTEGER NOT NULL DEFAULT 0,
            next_retry_at INTEGER
        )",
        [],
    )?;
    Ok(())
}

fn create_notes_mv(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes_mv (
            note_id    TEXT PRIMARY KEY,
            title      TEXT NOT NULL DEFAULT '',
            body       BLOB,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            deleted    INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;
    Ok(())
}

fn create_apply_log(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS apply_log (op_id TEXT PRIMARY KEY)",
        [],
    )?;
    Ok(())
}

fn create_device_state(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS device_state (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;
    Ok(())
}