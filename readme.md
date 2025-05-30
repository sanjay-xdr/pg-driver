# Postgres Driver from Scratch (Node.js)

---

## Overview

This project is a PostgreSQL driver for Node.js, written entirely from scratch.  
It aims to provide a minimal, transparent, and educational implementation of the PostgreSQL [Protocol](https://www.postgresql.org/docs/current/protocol.html)
It demonstrates how to connect, handle authentication, parse protocol messages, and execute SQL queries **without using any external libraries** for PostgreSQL.

## Features

- Connects to a PostgreSQL server using Node.js's `net` module
- Authenticates using cleartext password
- Parses key protocol messages:
  - `AuthenticationOk`
  - `ParameterStatus`
  - `BackendKeyData`
  - `ReadyForQuery`
  - `RowDescription`
  - `DataRow`
- Sends basic SQL queries (e.g., `SELECT now();`)
- Decodes and prints result rows and column descriptions

## How It Works

The client follows these steps:

1. **Startup:** Sends a startup message with user and database.
2. **Authentication:** Handles cleartext password authentication.
3. **Session Setup:** Receives server parameters (`ParameterStatus`) and backend info (`BackendKeyData`). (NOTE: we are not using as of NOW)
4. **Ready State:** Waits for `ReadyForQuery` before sending SQL queries.
5. **Query:** Sends a SQL query and parses the response (column info and data row).
6. **Result Parsing:** Extracts and prints column names and result values.

## Usage

1. **Clone the repository:**

   ```sh
   git clone https://github.com/sanjay-xdr/pg-driver
   cd pg-driver
   npm i
   ```

2. **Edit connection settings:**
   Open `pg-protocol.ts` and set your PostgreSQL credentials:

   ```js
   const config = {
     host: "localhost",
     port: 5432,
     password: "sanjay",
     userName: "postgres",
     db: "Hotel",
   };
   ```

3. **Build and Run the client:**
   ```sh
   npm run build
   npm run start
   ```
   You should see output for the connection, authentication, and query results (e.g., current date/time).

## Example Output

```
RESULT  { now: '2025-05-30 13:10:54.039803+05:30' }
 Query Exectued SELECT 1
```
