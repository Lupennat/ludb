export enum ISOLATION_LEVEL {
    NO_CHANGE = 0x00,
    READ_UNCOMMITTED = 0x01,
    READ_COMMITTED = 0x02,
    REPEATABLE_READ = 0x03,
    SERIALIZABLE = 0x04,
    SNAPSHOT = 0x05
}

export interface LupdoSqlserverOptions {
    /**
     * Hostname to connect to.
     * It Accept a list of Hosts of type host:port for random connection
     */
    server?: string | string[] | undefined;

    /**
     * Once you set domain, driver will connect to SQL Server using domain login.
     */
    domain?: string | undefined;

    /**
     * Further options
     */
    options?: {
        /**
         * If true, Numeric and Decimal will be serialized as string. (default: false)
         */
        returnDecimalAndNumericAsString?: boolean;

        /**
         * If true, Dates and Times will be serialized as object. (default: false)
         */
        returnDateTimeAsObject?: boolean;

        /**
         * If true, Money and SmallMoney will be serialized as string. (default: false)
         */
        returnMoneyAsString?: boolean;

        /**
         * Port to connect to (default: 1433). Mutually exclusive with options.instanceName.
         */
        port?: number | undefined;

        /**
         * The instance name to connect to. The SQL Server Browser service must be running on the database server,
         * and UDP port 1444 on the database server must be reachable. (no default) Mutually exclusive with options.port.
         */
        instanceName?: string | undefined;

        /**
         * Database to connect to (default: dependent on server configuration).
         */
        database?: string | undefined;

        /**
         * By default, if the database requested by options.database cannot be accessed,
         * the connection will fail with an error. However, if options.fallbackToDefaultDb is set to true,
         * then the user's default database will be  * used instead (Default: false).
         */
        fallbackToDefaultDb?: boolean | undefined;

        /**
         * The number of milliseconds before the attempt to connect is considered failed (default: 15000).
         */
        connectTimeout?: number | undefined;

        /**
         * The number of milliseconds before a request is considered failed, or 0 for no timeout (default: 15000).
         */
        requestTimeout?: number | undefined;

        /**
         * The number of milliseconds before the cancel (abort) of a request is considered failed (default: 5000).
         */
        cancelTimeout?: number | undefined;

        /**
         * The size of TDS packets (subject to negotiation with the server). Should be a power of 2. (default: 4096).
         */
        packetSize?: number | undefined;

        /**
         * A boolean determining whether to pass time values in UTC or local time. (default: true).
         */
        useUTC?: boolean | undefined;

        /**
         * A boolean determining whether to rollback a transaction automatically if any error is encountered
         * during the given transaction's execution. This sets the value for SET XACT_ABORT during the initial
         * SQL phase of a connection (documentation).
         */
        abortTransactionOnError?: boolean | undefined;

        /**
         * A string indicating which network interface (ip address) to use when connecting to SQL Server.
         */
        localAddress?: string | undefined;

        /**
         * A boolean determining whether to return rows as arrays or key-value collections. (default: false).
         */
        useColumnNames?: boolean | undefined;

        /**
         * A boolean, controlling whether the column names returned will have the first letter converted
         * to lower case (true) or not. This value is ignored if you provide a columnNameReplacer. (default: false).
         */
        camelCaseColumns?: boolean | undefined;

        /**
         * A function with parameters (columnName, index, columnMetaData) and returning a string. If provided,
         * this will be called once per column per result-set. The returned value will be used instead of the
         * SQL-provided column name on row and meta data objects. This allows you to dynamically convert between
         * naming conventions. (default: null).
         */
        columnNameReplacer?: ((columnName: string, index: number, columnMetaData: any) => string) | undefined;

        /**
         *
         */
        columnEncryptionSetting?: boolean;

        /**
         * The default isolation level that transactions will be run with. (default: READ_COMMITTED).
         */
        isolationLevel?: ISOLATION_LEVEL | undefined;

        /**
         * The default isolation level for new connections. All out-of-transaction queries are executed with this setting. (default: READ_COMMITED)
         */
        connectionIsolationLevel?: ISOLATION_LEVEL | undefined;

        /**
         * A boolean, determining whether the connection will request read only access from a SQL Server Availability Group. For more information, see here. (default: false).
         */
        readOnlyIntent?: boolean | undefined;

        /**
         * A boolean determining whether or not the connection will be encrypted. Set to true if you're on Windows Azure. (default: false).
         */
        encrypt?: boolean | undefined;

        /**
         * When encryption is used, an object may be supplied that will be used for the first argument when calling tls.createSecurePair (default: {}).
         */
        cryptoCredentialsDetails?: {
            /**
             * If set, this will be called when a client opens a connection using the ALPN extension.
             * One argument will be passed to the callback: an object containing `servername` and `protocols` fields,
             * respectively containing the server name from the SNI extension (if any) and an array of
             * ALPN protocol name strings. The callback must return either one of the strings listed in `protocols`,
             * which will be returned to the client as the selected ALPN protocol, or `undefined`,
             * to reject the connection with a fatal alert. If a string is returned that does not match one of
             * the client's ALPN protocols, an error will be thrown.
             * This option cannot be used with the `ALPNProtocols` option, and setting both options will throw an error.
             */
            ALPNCallback?: ((arg: { servername: string; protocols: string[] }) => string | undefined) | undefined;
            /**
             * Optionally override the trusted CA certificates. Default is to trust
             * the well-known CAs curated by Mozilla. Mozilla's CAs are completely
             * replaced when CAs are explicitly specified using this option.
             */
            ca?: string | Buffer | Array<string | Buffer> | undefined;
            /**
             *  Cert chains in PEM format. One cert chain should be provided per
             *  private key. Each cert chain should consist of the PEM formatted
             *  certificate for a provided private key, followed by the PEM
             *  formatted intermediate certificates (if any), in order, and not
             *  including the root CA (the root CA must be pre-known to the peer,
             *  see ca). When providing multiple cert chains, they do not have to
             *  be in the same order as their private keys in key. If the
             *  intermediate certificates are not provided, the peer will not be
             *  able to validate the certificate, and the handshake will fail.
             */
            cert?: string | Buffer | Array<string | Buffer> | undefined;
            /**
             *  Colon-separated list of supported signature algorithms. The list
             *  can contain digest algorithms (SHA256, MD5 etc.), public key
             *  algorithms (RSA-PSS, ECDSA etc.), combination of both (e.g
             *  'RSA+SHA384') or TLS v1.3 scheme names (e.g. rsa_pss_pss_sha512).
             */
            sigalgs?: string | undefined;
            /**
             * Cipher suite specification, replacing the default. For more
             * information, see modifying the default cipher suite. Permitted
             * ciphers can be obtained via tls.getCiphers(). Cipher names must be
             * uppercased in order for OpenSSL to accept them.
             */
            ciphers?: string | undefined;
            /**
             * Name of an OpenSSL engine which can provide the client certificate.
             */
            clientCertEngine?: string | undefined;
            /**
             * PEM formatted CRLs (Certificate Revocation Lists).
             */
            crl?: string | Buffer | Array<string | Buffer> | undefined;
            /**
             * `'auto'` or custom Diffie-Hellman parameters, required for non-ECDHE perfect forward secrecy.
             * If omitted or invalid, the parameters are silently discarded and DHE ciphers will not be available.
             * ECDHE-based perfect forward secrecy will still be available.
             */
            dhparam?: string | Buffer | undefined;
            /**
             * A string describing a named curve or a colon separated list of curve
             * NIDs or names, for example P-521:P-384:P-256, to use for ECDH key
             * agreement. Set to auto to select the curve automatically. Use
             * crypto.getCurves() to obtain a list of available curve names. On
             * recent releases, openssl ecparam -list_curves will also display the
             * name and description of each available elliptic curve. Default:
             * tls.DEFAULT_ECDH_CURVE.
             */
            ecdhCurve?: string | undefined;
            /**
             * Attempt to use the server's cipher suite preferences instead of the
             * client's. When true, causes SSL_OP_CIPHER_SERVER_PREFERENCE to be
             * set in secureOptions
             */
            honorCipherOrder?: boolean | undefined;
            /**
             * Private keys in PEM format. PEM allows the option of private keys
             * being encrypted. Encrypted keys will be decrypted with
             * options.passphrase. Multiple keys using different algorithms can be
             * provided either as an array of unencrypted key strings or buffers,
             * or an array of objects in the form {pem: <string|buffer>[,
             * passphrase: <string>]}. The object form can only occur in an array.
             * object.passphrase is optional. Encrypted keys will be decrypted with
             * object.passphrase if provided, or options.passphrase if it is not.
             */
            key?:
                | string
                | Buffer
                | Array<
                      | string
                      | Buffer
                      | {
                            /**
                             * Private keys in PEM format.
                             */
                            pem: string | Buffer;
                            /**
                             * Optional passphrase.
                             */
                            passphrase?: string | undefined;
                        }
                  >
                | undefined;
            /**
             * Name of an OpenSSL engine to get private key from. Should be used
             * together with privateKeyIdentifier.
             */
            privateKeyEngine?: string | undefined;
            /**
             * Identifier of a private key managed by an OpenSSL engine. Should be
             * used together with privateKeyEngine. Should not be set together with
             * key, because both options define a private key in different ways.
             */
            privateKeyIdentifier?: string | undefined;
            /**
             * Optionally set the maximum TLS version to allow. One
             * of `'TLSv1.3'`, `'TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`. Cannot be specified along with the
             * `secureProtocol` option, use one or the other.
             * **Default:** `'TLSv1.3'`, unless changed using CLI options. Using
             * `--tls-max-v1.2` sets the default to `'TLSv1.2'`. Using `--tls-max-v1.3` sets the default to
             * `'TLSv1.3'`. If multiple of the options are provided, the highest maximum is used.
             */
            maxVersion?: string | undefined;
            /**
             * Optionally set the minimum TLS version to allow. One
             * of `'TLSv1.3'`, `'TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`. Cannot be specified along with the
             * `secureProtocol` option, use one or the other.  It is not recommended to use
             * less than TLSv1.2, but it may be required for interoperability.
             * **Default:** `'TLSv1.2'`, unless changed using CLI options. Using
             * `--tls-v1.0` sets the default to `'TLSv1'`. Using `--tls-v1.1` sets the default to
             * `'TLSv1.1'`. Using `--tls-min-v1.3` sets the default to
             * 'TLSv1.3'. If multiple of the options are provided, the lowest minimum is used.
             */
            minVersion?: string | undefined;
            /**
             * Shared passphrase used for a single private key and/or a PFX.
             */
            passphrase?: string | undefined;
            /**
             * PFX or PKCS12 encoded private key and certificate chain. pfx is an
             * alternative to providing key and cert individually. PFX is usually
             * encrypted, if it is, passphrase will be used to decrypt it. Multiple
             * PFX can be provided either as an array of unencrypted PFX buffers,
             * or an array of objects in the form {buf: <string|buffer>[,
             * passphrase: <string>]}. The object form can only occur in an array.
             * object.passphrase is optional. Encrypted PFX will be decrypted with
             * object.passphrase if provided, or options.passphrase if it is not.
             */
            pfx?:
                | string
                | Buffer
                | Array<
                      | string
                      | Buffer
                      | {
                            /**
                             * PFX or PKCS12 encoded private key and certificate chain.
                             */
                            buf: string | Buffer;
                            /**
                             * Optional passphrase.
                             */
                            passphrase?: string | undefined;
                        }
                  >
                | undefined;
            /**
             * Optionally affect the OpenSSL protocol behavior, which is not
             * usually necessary. This should be used carefully if at all! Value is
             * a numeric bitmask of the SSL_OP_* options from OpenSSL Options
             */
            secureOptions?: number | undefined; // Value is a numeric bitmask of the `SSL_OP_*` options
            /**
             * Legacy mechanism to select the TLS protocol version to use, it does
             * not support independent control of the minimum and maximum version,
             * and does not support limiting the protocol to TLSv1.3. Use
             * minVersion and maxVersion instead. The possible values are listed as
             * SSL_METHODS, use the function names as strings. For example, use
             * 'TLSv1_1_method' to force TLS version 1.1, or 'TLS_method' to allow
             * any TLS protocol version up to TLSv1.3. It is not recommended to use
             * TLS versions less than 1.2, but it may be required for
             * interoperability. Default: none, see minVersion.
             */
            secureProtocol?: string | undefined;
            /**
             * Opaque identifier used by servers to ensure session state is not
             * shared between applications. Unused by clients.
             */
            sessionIdContext?: string | undefined;
            /**
             * 48-bytes of cryptographically strong pseudo-random data.
             * See Session Resumption for more information.
             */
            ticketKeys?: Buffer | undefined;
            /**
             * The number of seconds after which a TLS session created by the
             * server will no longer be resumable. See Session Resumption for more
             * information. Default: 300.
             */
            sessionTimeout?: number | undefined;
        };

        /**
         * A boolean, that when true will expose received rows in Requests' done* events. See done, doneInProc and doneProc. (default: false)
         * Caution: If many row are received, enabling this option could result in excessive memory usage.
         */
        rowCollectionOnDone?: boolean | undefined;

        /**
         * A boolean, that when true will expose received rows in Requests' completion callback. See new Request. (default: false)
         * Caution: If many row are received, enabling this option could result in excessive memory usage.
         */
        rowCollectionOnRequestCompletion?: boolean | undefined;

        /**
         * The version of TDS to use. If server doesn't support specified version, negotiated version is used instead. (default: 7_4).
         * Take this from tedious.TDS_VERSION.7_4 .
         */
        tdsVersion?: string | undefined;

        /**
         * Application name used for identifying a specific application in profiling, logging or tracing tools of SQL Server. (default: Tedious)
         */
        appName?: string | undefined;

        /**
         * Number of milliseconds before retrying to establish connection, in case of transient failure. (default: 500)
         */
        connectionRetryInterval?: number | undefined;

        /**
         * Number that sets to the first day of the week, it can be a number from 1 through 7.(default: 7, i.e, first day of the week is Sunday)
         */
        datefirst?: number | undefined;

        /**
         * A string representing position of month, day and year in temporal datatypes. (default: mdy)
         */
        dateFormat?: string | undefined;

        /**
         * A boolean, controls the way null values should be used during comparison operation. (default: true)
         */
        enableAnsiNull?: boolean | undefined;

        /**
         * If true, SET ANSI_NULL_DFLT_ON ON will be set in the initial sql. This means new columns will be nullable by default. See the T-SQL documentation for more details. (Default: true).
         */
        enableAnsiNullDefault?: boolean | undefined;

        /**
         * A boolean, controls if padding should be applied for values shorter than the size of defined column. (default: true)
         */
        enableAnsiPadding?: boolean | undefined;

        /**
         * If true, SQL Server will follow ISO standard behavior during various error conditions. For details, see documentation. (default: true)
         */
        enableAnsiWarnings?: boolean | undefined;

        /**
         * A boolean, determines if query execution should be terminated during overflow or divide-by-zero error. (default: false)
         */
        enableArithAbort?: boolean | undefined;

        /**
         * A boolean, determines if concatenation with NULL should result in NULL or empty string value, more details in documentation. (default: true)
         */
        enableConcatNullYieldsNull?: boolean | undefined;

        /**
         * A boolean, controls whether cursor should be closed, if the transaction opening it gets committed or rolled back. (default: false)
         */
        enableCursorCloseOnCommit?: boolean | undefined;

        /**
         * A boolean, sets the connection to either implicit or autocommit transaction mode. (default: false)
         */
        enableImplicitTransactions?: boolean | undefined;

        /**
         * If false, error is not generated during loss of precession. (default: false)
         */
        enableNumericRoundabort?: boolean | undefined;

        /**
         * If true, characters enclosed in single quotes are treated as literals and those enclosed double quotes are treated as identifiers. (default: true)
         */
        enableQuotedIdentifier?: boolean | undefined;

        /**
         * A string, sets the language of the session (default: us_english)
         */
        language?: string | undefined;

        /**
         * Number of retries on transient error (default: 3)
         */
        maxRetriesOnTransientErrors?: number | undefined;

        /**
         * Size of data to be returned by SELECT statement for varchar(max), nvarchar(max), varbinary(max), text, ntext, and image type. (default: 2147483647)
         */
        textsize?: number | undefined;

        /**
         * A boolean, that verifies whether server's identity matches it's certificate's names (default: true)
         */
        trustServerCertificate?: boolean | undefined;

        /**
         * A boolean determining whether to parse unique identifier type with lowercase case characters (default: `false`).
         */
        lowerCaseGuids?: boolean;

        /**
         * Sets the MultiSubnetFailover = True parameter, which can help minimize the client recovery latency when failovers occur (default: `false`).
         */
        multiSubnetFailover?: boolean;

        /**
         * The workstation ID (WSID) of the client, default os.hostname(). Used for identifying a specific client in profiling, logging or tracing client activity in SQLServer. The value is reported by the TSQL function HOST_NAME().
         */
        workstationId?: string | undefined;
    };

    /**
     * Authentication Options
     */
    authentication?: {
        /**
         * Authentication Type. Default value is 'default'.
         */
        type?: string | undefined;

        /**
         * Authentication Options
         */
        options: {
            /**
             * Once you set domain, driver will connect to SQL Server using domain login.
             */
            domain?: string | undefined;

            /**
             * User name to use for authentication.
             */
            userName?: string | undefined;

            /**
             * Password to use for authentication.
             */
            password?: string | undefined;

            /**
             * Authentication token used when type is 'azure-active-directory-access-token'
             */
            token?: string | undefined;

            /**
             * Optional application (client) ID from your registered Azure application
             */
            clientId?: string | undefined;

            /**
             * Optional parameter for specific Azure tenant ID
             */
            tenantId?: string | undefined;
        };
    };
}
