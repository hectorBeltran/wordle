// importación para el uso request y response
import { Request, Response } from 'express'
import { readFile } from 'node:fs/promises'
const path = require('path')
import { conexion } from '../database'

/**
 * Obtiene una palabra aletaría y la devuelve
 * @param req 
 * @param res 
 */
export async function palabra(req: Request, res: Response) {
    let estatus: string = ''
    let mensaje: string = ''
    let palabra: string = ''

    try {
        // recibe los parametros post
        const nombre: string = req.body.nombre
        const correo: string = req.body.correo

        if (nombre !== '' && correo !== '') {
            // lee el archivo que tiene las palabras
            const palabras = await readFile(path.resolve(__dirname, '../diccionario/words/words.txt'), 'utf-8')
            // convierte en array
            const listaPalabras = palabras.split('\n')
            
            if (listaPalabras.length > 0) {
                // conexión a la db
                const conn: any = await conexion()
                
                const usuario = await datosUsuario(nombre, correo, conn)

                if (usuario.rowCount > 0) {
                    // filtra todas las palabras que tengan 5 letras y que sea distinto a la última palabra
                    const listaFiltrada = listaPalabras.filter(palabra => palabra.length === 5 && palabra !== usuario.rows[0].ultima_palabra)

                    if (listaFiltrada.length > 0) {
                        const random = Math.floor(Math.random() * listaFiltrada.length)

                        // actualiza la última palabra para el usuario, restablece los intentos a 0 y suma una partida más al usuario
                        const partidas: number = Number.parseInt(usuario.rows[0].numero_partidas) + 1
                        await conn.query(`update usuario set ultima_palabra = '${listaFiltrada[random]}', intentos = 0, numero_partidas = '${partidas}' where nombre = '${nombre}' and correo = '${correo}'`)

                        estatus = '200'
                        mensaje = 'ok'
                        palabra = listaFiltrada[random]
                    } else {
                        estatus = '-5'
                        mensaje = 'Error, no se encontrarón palabras de 5 letras'
                    }
                } else {
                    estatus = '-4'
                    mensaje = 'Error, no se encontró la última palabra'
                }

                conn.end()
            } else {
                estatus = '-3'
                mensaje = 'Error, no se encontro información dentro del archivo'
            }
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
        palabra: palabra
    })
}

/**
 * Compara la palabra del usuario con la palabra aleatoria que se le dio
 * @param req 
 * @param res 
 */
export async function comparar(req: Request, res: Response) {
    let estatus: string = ''
    let mensaje: string = ''
    let resultado: any[] = []
    let gano: boolean = false

    try {
        // recibe los parametros post
        const palabra: string = req.body.user_word
        const nombre: string = req.body.nombre
        const correo: string = req.body.correo
        
        // verifica que la palabra recibida tenga 5 letras
        if (palabra.length === 5) {
            if (nombre !== '' && correo !== '') {
                // conexión a la db
                const conn: any = await conexion()

                const usuario = await datosUsuario(nombre, correo, conn)
                
                if (usuario.rowCount > 0) {
                    if (Number.parseInt(usuario.rows[0].intentos) < 5) {
                        const listaComparacion = []

                        // recorre la palabra y verifica cada letra si coincide con el resultado de la consulta
                        let bandera: number = 0
                        for (let i = 0; i < palabra.length; i++) {
                            let obj
                            if (palabra[i] === usuario.rows[0].ultima_palabra[i]) {
                                obj = {
                                    "letter": palabra[i],
                                    "value": 1
                                }
                                bandera++
                            } else if (usuario.rows[0].ultima_palabra.includes(palabra[i])) {
                                obj = {
                                    "letter": palabra[i],
                                    "value": 2
                                }
                            } else {
                                obj = {
                                    "letter": palabra[i],
                                    "value": 3
                                }
                            }

                            listaComparacion.push(obj)
                        }

                        const intentos: number = Number.parseInt(usuario.rows[0].intentos) + 1
                        // verifica si gano el juego
                        if (bandera === 5) {
                            // suma un intento más al usuario y le suma una victoría más
                            const victorias: number = Number.parseInt(usuario.rows[0].victorias) + 1
                            await conn.query(`update usuario set intentos = ${intentos}, victorias = '${victorias}' where nombre = '${nombre}' and correo = '${correo}'`)

                            // busca el registro de la palabra
                            const historial = await buscarPalabra(palabra, conn)
                            if (historial.rowCount > 0) {
                                const idPalabra = Number.parseInt(historial.rows[0].id_palabra)
                                const cantidad = Number.parseInt(historial.rows[0].cantidad) + 1
                                actualizarHistorial(idPalabra, cantidad, conn)
                            } else {
                                await crearHistorial(palabra, conn)
                            }

                            gano = true
                        } else {
                            // suma un intento más al usuario
                            await conn.query(`update usuario set intentos = ${intentos} where nombre = '${nombre}' and correo = '${correo}'`)
                        }

                        estatus = '200'
                        mensaje = 'ok'
                        resultado = listaComparacion
                    } else {
                        estatus = '-5'
                        mensaje = 'Ya no tiene intentos disponibles'
                    }                
                } else {
                    estatus = '-4'
                    mensaje = 'Error, no se encontró la última palabra'
                }

                conn.end()
            } else {
                estatus = '-3'
                mensaje = 'Es necesario el nombre y correo del usuario'
            }
        } else {
            estatus = '-2'
            mensaje = 'Error, la palabra debe tener 5 letras'
        }
    } catch (error: any) {
        estatus = '-1'
        mensaje = error.message
    }

    res.json({
        estatus: estatus,
        mensage: mensaje,
        resultado: resultado,
        gano: gano
    })
}


/**
 * Función para regresar las palabras más acertadas
 * @param req 
 * @param res 
 */
export async function topPalabras(req: Request, res: Response) {
    let estatus: string = ''
    let mensaje: string = ''
    let resultado: any[] = []

    try {
        // conexión a la db
        const conn: any = await conexion()

        // busca las palabras más acertadas
        const listaPalabras = await conn.query('select descripcion, cantidad from palabra order by cantidad desc limit 100')

        if (listaPalabras.rowCount > 0) {
            estatus = '200'
            mensaje = 'ok'
            resultado = listaPalabras.rows
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

/**
 * Función para buscar si la palabra se encuentra registrada dentro del historial
 * @param palabra 
 * @param conn 
 * @returns 
 */
async function buscarPalabra(palabra: string, conn: any) {
    const registro = await conn.query(`select id_palabra, descripcion, cantidad from palabra where descripcion = '${palabra}'`)
    return registro
}

/**
 * Función para crear el historial de palabra acertada
 * @param palabra 
 * @param cantidad 
 * @param conn 
 * @returns 
 */
async function crearHistorial(palabra: string, conn: any) {
    const crear = await conn.query(`insert into palabra (descripcion, cantidad) values ('${palabra}', 1)`)
    return crear
}

/**
 * Función para actualizar el historial de la palabra acertada
 * @param idPalabra 
 * @param cantidad 
 * @param conn 
 * @returns 
 */
async function actualizarHistorial(idPalabra: number, cantidad: number, conn: any) {
    const actualizar = await conn.query(`update palabra set cantidad = ${cantidad} where id_palabra = ${idPalabra}`)
    return actualizar
}