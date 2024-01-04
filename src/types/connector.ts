import { Pdo } from 'lupdo';
import ConnectionConfig, { FlattedConnectionConfig } from './config';

export default interface ConnectorI {
    connect(config: FlattedConnectionConfig<ConnectionConfig>): Pdo;
}
