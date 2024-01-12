import stream from 'node:stream';

export interface LupdoPostgresOptions {
    /**
     * The hostname of the database you are connecting to.
     * It Accept a list of Hosts of type host:port for random connection
     */
    host?: string | string[] | undefined;
    user?: string | undefined;
    database?: string | undefined;
    password?: string | (() => string | Promise<string>) | undefined;
    port?: number | undefined;
    connectionString?: string | undefined;
    keepAlive?: boolean | undefined;
    stream?: () => stream.Duplex | stream.Duplex | undefined;
    statement_timeout?: false | number | undefined;
    ssl?: boolean | Record<string, any> | undefined;
    query_timeout?: number | undefined;
    keepAliveInitialDelayMillis?: number | undefined;
    idle_in_transaction_session_timeout?: number | undefined;
    application_name?: string | undefined;
    connectionTimeoutMillis?: number | undefined;
    options?: string | undefined;
}
