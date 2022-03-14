import { Router } from 'express';
import UserRoutes from './routes/userRoutes';
import StreamRoutes from './routes/streamRoutes';
/*
import GymRoutes from './routes/gym';
import WallRoutes from './routes/wall';
import RouteRoutes from './routes/route';*/
// ...


export default class PathRouter {
    public static init(app: any, router: Router): Router {
        app.use('/users', UserRoutes.init(router));
        
        /*app.use('/gym', GymRoutes.init);
        app.use('/wall', WallRoutes.init);
        app.use('/route', RouteRoutes.init);*/
        
        app.use('/streams', StreamRoutes.init(router));
        return router;
    }
}