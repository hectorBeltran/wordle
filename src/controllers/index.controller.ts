// importación para el uso request y response
import { Request, Response } from 'express';

// función que regresa un mensaje de bienvenida
export function inicio(req: Request, res: Response) {
    res.json('Bienvenido a la Api');
}