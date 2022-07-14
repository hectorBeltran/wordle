// se añade la librería de postgres
const { Pool } = require('pg')

export async function conexion() {
    return await new Pool({
        host: 'localhost',
        user: 'postgres',
        password: 'abc123',
        database: 'wordle',
        port: '5432'
    })
}