import { Router, Express} from 'express';
import UserRoutes from './routes/userRoutes';
import StreamRoutes from './routes/streamRoutes';
import GymRoutes from './routes/gymRoutes';
/*
import WallRoutes from './routes/wall';
import RouteRoutes from './routes/route';*/
// ...


export default function (app: Express):void {
    app.use('/users', UserRoutes);
    app.use('/gyms', GymRoutes);
    /*
    app.use('/wall', WallRoutes.init);
    app.use('/route', RouteRoutes.init);
    */

    app.use('/streams', StreamRoutes);
}