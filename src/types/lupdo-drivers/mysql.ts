export interface LupdoMysqlOptions {
    /**
     * The MySQL user to authenticate as
     */
    user?: string;

    /**
     * The password of that MySQL user
     */
    password?: string;

    /**
     * Name of the database to use for this connection
     */
    database?: string;

    /**
     * The charset for the connection. This is called 'collation' in the SQL-level of MySQL (like utf8_general_ci).
     * If a SQL-level charset is specified (like utf8mb4) then the default collation for that charset is used.
     * (Default: 'UTF8_GENERAL_CI')
     */
    charset?: string;

    /**
     * The hostname of the database you are connecting to. (Default: localhost)
     * It Accept a list of Hosts of type host:port for round robin connection
     */
    host?: string | string[];

    /**
     * The port number to connect to. (Default: 3306)
     */
    port?: number;

    /**
     * The source IP address to use for TCP connection
     */
    localAddress?: string;

    /**
     * The path to a unix domain socket to connect to. When used host and port are ignored
     */
    socketPath?: string;

    /**
     * The timezone used to store local dates. (Default: 'local')
     */
    timezone?: string | 'local';

    /**
     * The milliseconds before a timeout occurs during the initial connection to the MySQL server. (Default: 10 seconds)
     */
    connectTimeout?: number;

    /**
     * Stringify objects instead of converting to values. (Default: 'false')
     */
    stringifyObjects?: boolean;

    /**
     * Allow connecting to MySQL instances that ask for the old (insecure) authentication method. (Default: false)
     */
    insecureAuth?: boolean;

    /**
     * Determines if column values should be converted to native JavaScript types. It is not recommended (and may go away / change in the future)
     * to disable type casting, but you can currently do so on either the connection or query level. (Default: true)
     *
     * You can also specify a function (field: any, next: () => void) => {} to do the type casting yourself.
     *
     * WARNING: YOU MUST INVOKE the parser using one of these three field functions in your custom typeCast callback. They can only be called once.
     *
     * field.string()
     * field.buffer()
     * field.geometry()
     *
     * are aliases for
     *
     * parser.parseLengthCodedString()
     * parser.parseLengthCodedBuffer()
     * parser.parseGeometryValue()
     *
     * You can find which field function you need to use by looking at: RowDataPacket.prototype._typeCast
     */
    typeCast?: boolean | ((field: any, next: () => void) => any);

    /**
     * A custom query format function
     */
    queryFormat?: (query: string, values: any) => void;

    /**
     * When dealing with big numbers (BIGINT and DECIMAL columns) in the database, you should enable this option
     * (Default: false)
     */
    supportBigNumbers?: boolean;

    /**
     * Enabling both supportBigNumbers and bigNumberStrings forces big numbers (BIGINT and DECIMAL columns) to be
     * always returned as JavaScript String objects (Default: false). Enabling supportBigNumbers but leaving
     * bigNumberStrings disabled will return big numbers as String objects only when they cannot be accurately
     * represented with [JavaScript Number objects] (http://ecma262-5.com/ELS5_HTML.htm#Section_8.5)
     * (which happens when they exceed the [-2^53, +2^53] range), otherwise they will be returned as Number objects.
     * This option is ignored if supportBigNumbers is disabled.
     */
    bigNumberStrings?: boolean;

    /**
     * Force date types (TIMESTAMP, DATETIME, DATE) to be returned as strings rather then inflated into JavaScript Date
     * objects. Can be true/false or an array of type names to keep as strings.
     *
     * (Default: false)
     */
    dateStrings?: boolean | Array<'TIMESTAMP' | 'DATETIME' | 'DATE'>;

    /**
     * This will print all incoming and outgoing packets on stdout.
     * You can also restrict debugging to packet types by passing an array of types (strings) to debug;
     *
     * (Default: false)
     */
    debug?: any;

    /**
     * Generates stack traces on Error to include call site of library entrance ('long stack traces'). Slight
     * performance penalty for most calls. (Default: true)
     */
    trace?: boolean;

    /**
     * Allow multiple mysql statements per query. Be careful with this, it exposes you to SQL injection attacks. (Default: false)
     */
    multipleStatements?: boolean;

    /**
     * List of connection flags to use other than the default ones. It is also possible to blacklist default ones
     */
    flags?: Array<string>;

    /**
     * object with ssl parameters or a string containing name of ssl profile
     */
    ssl?:
        | string
        | {
              /**
               * A string or buffer holding the PFX or PKCS12 encoded private key, certificate and CA certificates
               */
              pfx?: string;

              /**
               * A string holding the PEM encoded private key
               */
              key?: string;

              /**
               * A string of passphrase for the private key or pfx
               */
              passphrase?: string;

              /**
               * A string holding the PEM encoded certificate
               */
              cert?: string;

              /**
               * Either a string or list of strings of PEM encoded CA certificates to trust.
               */
              ca?: string | string[];

              /**
               * Either a string or list of strings of PEM encoded CRLs (Certificate Revocation List)
               */
              crl?: string | string[];

              /**
               * A string describing the ciphers to use or exclude
               */
              ciphers?: string;

              /**
               * You can also connect to a MySQL server without properly providing the appropriate CA to trust. You should not do this.
               */
              rejectUnauthorized?: boolean;
          };

    /**
     * Return each row as an array, not as an object.
     * This is useful when you have duplicate column names.
     * This can also be set in the `QueryOption` object to be applied per-query.
     */
    rowsAsArray?: boolean;

    charsetNumber?: number;
    compress?: boolean;
    authSwitchHandler?: (data: any, callback: () => void) => any;
    connectAttributes?: { [param: string]: any };
    decimalNumbers?: boolean;
    isServer?: boolean;
    maxPreparedStatements?: number;
    namedPlaceholders?: boolean;
    nestTables?: boolean | string;
    passwordSha1?: string;
    pool?: any;
    stream?: any;
    uri?: string;
    connectionLimit?: number;
    Promise?: any;
    queueLimit?: number;
    waitForConnections?: boolean;
    authPlugins?: {
        [key: string]: (pluginMetadata: {
            connection: any;
            command: string;
        }) => (pluginData: Buffer) => Promise<string> | string | Buffer | Promise<Buffer> | null;
    };
}
