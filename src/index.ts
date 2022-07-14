import { App } from "./app"

// función para iniciar el servidor
async function main() {
    const app = new App(3000)
    await app.listen()
}

main()