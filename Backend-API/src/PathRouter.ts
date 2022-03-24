import { Router, Express} from 'express';
import UserRoutes from './routes/userRoutes';
import StreamRoutes from './routes/streamRoutes';
import GymRoutes from './routes/gymRoutes';
import WallRoutes from './routes/wallRoutes';
import RouteRoutes from './routes/routeRoutes';
// ...


export default function (app: Express):void {
    app.use('/users', UserRoutes);
    app.use('/gyms', GymRoutes);
    app.use('/walls', WallRoutes)
    app.use('/routes', RouteRoutes);

    app.use('/streams', StreamRoutes); // TODO: Implement stream routes or delete this line
}
