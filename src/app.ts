// importación de express y morgan
import express, { Application } from 'express'
import morgan from 'morgan'
// importación de las rutas
import PalabraRoutes from './routes/palabra.routes'
import InicioRoutes from './routes/index.routes'
import UsuarioRoutes from './routes/usuario.routes'

export class App {

    // declaración de las propiedades
    private app: Application

    // constructor de la clase
    constructor(private port?: number | string) {
        this.app = express()
        this.settings()
        this.middleware()
        this.routes()
    }

    // método de configuración
    settings() {
        // aquí el servidor setea el puerto con el port dado o en caso de no estar utiliza la variable de entorno para ese puerto y si no esta entonces se utiliza el 3000
        this.app.set('port', this.port || process.env.PORT || 3000)
    }

    // método para el middleware
    middleware() {
        // aquí se le dice a morgan que se muestre por consola los mensajes de las solicitudes HTTP
        this.app.use(morgan('dev'))
        
        // aquí se le dice al servidor que pueda recibir datos de formularios
        this.app.use(express.urlencoded({
            extended: false
        }));

        // aquí se le dice al servidor que pueda recibir datos en formato json
        this.app.use(express.json())
    }

    // método para utilizar las rutas
    routes() {
        this.app.use('/', InicioRoutes)
        this.app.use('/palabra', PalabraRoutes)
        this.app.use('/usuario', UsuarioRoutes)
    }

    // método de la clase para conectarse al puerto
    async listen() {
        await this.app.listen(this.app.get('port'))
        console.log('Server run on port ' + this.app.get('port'))
    }

}