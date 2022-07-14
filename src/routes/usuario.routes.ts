// importación de librerías
import { Router } from "express"
import { crear, partidas, topJugadores } from "../controllers/usuario.controller"

const router = Router()

// se define la ruta y al controller al cual dirigirá
router
.post('/', crear)
.post('/partidas', partidas)
.post('/top', topJugadores)

export default router;