// importación para el uso request y response
import { Request, Response } from 'express'
import { conexion } from '../database'

/**
 * Función para crear un usuario
 * @param req 
 * @param res 
 */
export async function crear(req: Request, res: Response) {
    let estatus: string = ''
    let mensaje: string = ''

    try {
        // recibe los parametros post
        const nombre: string = req.body.nombre
        const correo: string = req.body.correo

        if (nombre !== '' && correo !== '') {
            // conexión a la db
            const conn: any = await conexion();

            // consulta para verificar si ya existe el usuario
            const usuario = await datosUsuario(nombre, correo, conn)
            if (usuario.rowCount === 0) {
                // consulta para crear el usuario
                const crearUsuario = await conn.query(`insert into usuario (nombre, correo, ultima_palabra, intentos, numero_partidas, victorias) values ('${nombre}', '${correo}', '', 0, 0, 0)`)

                if (crearUsuario.rowCount === 1) {
                    estatus = '200'
                    mensaje = 'Usuario creado'
                } else {
                    estatus = '-4'
                    mensaje = 'Error, no se pudo crear el usuario'
                }
            } else {
                estatus = '-3'
                mensaje = 'El usuario ya existe'
            }

            conn.end()
        } else {
            estatus = '-2'
            mensaje = 'Para crear el usuario es necesario el nombre y correo'
        }
    } catch (error: any) {
        estatus = '-1'
        mensaje = error.message
    }

    res.json({
        estatus: estatus,
        mensage: mensaje
    })
}

/**
 * Función para conocer el numero de partidas jugadas y ganadas de un usuario
 * @param req 
 * @param res 
 */
export async function partidas(req: Request, res: Response) {
    let estatus: string = ''
    let mensaje: string = ''
    let juegos: number = 0
    let victorias: number = 0

    try {
        // recibe los parametros post
        const nombre: string = req.body.nombre
        const correo: string = req.body.correo

        if (nombre !== '' && correo !== '') {
            // conexión a la db
            const conn: any = await conexion();

            const usuario = await datosUsuario(nombre, correo, conn)
            if (usuario.rowCount > 0) {
                estatus = '200'
                mensaje = 'ok'
                juegos = Number.parseInt(usuario.rows[0].numero_partidas)
                victorias = Number.parseInt(usuario.rows[0].victorias)
            } else {
                estatus = '-3'
                mensaje = 'El usuario no existe'
            }

            conn.end()
        } else {
            estatus = '-2'
            mensaje = 'Es necesario el nombre y correo del usuario'
        }
    } catch (error: any) {
        estatus = '-1'
        mensaje = error.message
    }

    res.json({
        estatus: estatus,
        mensage: mensaje,
        partidas: juegos,
        victorias: victorias
    })
}

/**
 * Función para obtener el top 10 de mejores jugadores
 * @param req 
 * @param res 
 */
export async function topJugadores(req: Request, res: Response) {
    let estatus: string = ''
    let mensaje: string = ''
    let resultado: any[] = []

    try {
        // conexión a la db
        const conn: any = await conexion();

        // consulta el top 10 mejores jugadores
        const listaTop = await conn.query('select nombre, numero_partidas, victorias from usuario order by victorias desc limit 10')
        
        if (listaTop.rowCount > 0) {
            estatus = '200'
            mensaje = 'ok'
            resultado = listaTop.rows
        } else {
            estatus = '-2'
            mensaje = 'No se encontraron registros'
        }

        conn.end()
    } catch (error: any) {
        estatus = '-1'
        mensaje = error.message   
    }

    res.json({
        estatus: estatus,
        mensage: mensaje,
        resultado: resultado
    })
}

/**
 * Función para obtener los datos del usuario
 * @param nombre 
 * @param correo 
 * @returns 
 */
 async function datosUsuario(nombre: string, correo: string, conn: any) {
    const datosUsuario = await conn.query(`select ultima_palabra, intentos, numero_partidas, victorias from usuario where nombre = '${nombre}' and correo = '${correo}'`)
    return datosUsuario
}