// importación de librerías
import { Router } from "express"
import { inicio } from "../controllers/index.controller"

const router = Router()

// se define la ruta y al controller al cual dirigirá
router.route('/').get(inicio)

export default router;