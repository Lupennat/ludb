import { Pdo } from 'lupdo';
import DatabaseConfig from './config';

export default interface ConnectorI {
    connect(config: DatabaseConfig): Pdo;
}
