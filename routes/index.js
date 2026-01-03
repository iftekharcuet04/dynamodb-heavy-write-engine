import userRouter from './userRoutes.js';

import { Router } from 'express';

const router = Router()

const defaultRoutes = [
    {
        path: "/user",
        route: userRouter
    }
];

defaultRoutes.forEach((route) => {
    try {
        router.use(route.path, route.route);
    } catch (error) {
        console.error(`Error setting up route ${route.path}:`, error);
    }
});
  
export default router;