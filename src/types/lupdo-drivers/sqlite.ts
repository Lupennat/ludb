export interface LupdoSqliteOptions {
    readonly?: boolean | undefined;
    fileMustExist?: boolean | undefined;
    timeout?: number | undefined;
    verbose?: ((message?: unknown, ...additionalArgs: unknown[]) => void) | undefined;
    nativeBinding?: string | undefined;
    path: string;
    wal?: boolean;
    walSynchronous?: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
    walMaxSize?: number;
    onWalError?: (err: any) => void | Promise<void>;
}
