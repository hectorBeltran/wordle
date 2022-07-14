// importación de librerías
import { Router } from "express"
import { palabra, comparar, topPalabras} from "../controllers/palabra.controller"

const router = Router()

// se define la ruta y al controller al cual dirigirá
router
.post('/', palabra)
.post('/comparar', comparar)
.post('/top', topPalabras)

export default router;