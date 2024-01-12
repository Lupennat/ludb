import { Pdo, PdoConnection, PdoConnectionI, PdoDriver, PdoRawConnection, PdoRawConnectionI } from 'lupdo';
import PdoAffectingData from 'lupdo/dist/typings/types/pdo-affecting-data';
import PdoAttributes from 'lupdo/dist/typings/types/pdo-attributes';
import PdoColumnData from 'lupdo/dist/typings/types/pdo-column-data';
import { PoolConnection, PoolOptions } from 'lupdo/dist/typings/types/pdo-pool';
import { ValidBindingsSingle } from 'lupdo/dist/typings/types/pdo-prepared-statement';
import PdoRowData from 'lupdo/dist/typings/types/pdo-raw-data';

class FakeThirdPartyConnection implements PoolConnection {
    __lupdo_uuid = 'uuid';
    __lupdo_killed = false;
}

export class FakeConnection extends PdoConnection {
    version = '1.0.0';
    public async query(): Promise<void> {
        return void 0;
    }
}

class FakeRawConnection extends PdoRawConnection {
    protected async doBeginTransaction(): Promise<void> {
        return void 0;
    }
    protected async doCommit(): Promise<void> {
        return void 0;
    }
    protected async doRollback(): Promise<void> {
        return void 0;
    }
    protected async doQuery(): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
        return [{}, [], []];
    }
    protected async doExec(): Promise<PdoAffectingData> {
        return {};
    }
    protected async getStatement(): Promise<any> {
        return {};
    }
    protected async executeStatement(): Promise<[string, PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
        return ['', ...(await this.doQuery())];
    }
    protected async closeStatement(): Promise<void> {
        return void 0;
    }
    protected adaptBindValue(value: ValidBindingsSingle): ValidBindingsSingle {
        return value;
    }
}

class FakePdoDriver extends PdoDriver {
    constructor(
        driver: string,
        protected options: any,
        poolOptions: PoolOptions,
        attributes: PdoAttributes
    ) {
        super(driver, poolOptions, attributes);
    }
    protected async createConnection(): Promise<PoolConnection> {
        return new FakeThirdPartyConnection();
    }
    public getRawConnection(): PdoRawConnectionI {
        return new FakeRawConnection(this.pool);
    }
    protected async closeConnection(): Promise<void> {
        return void 0;
    }
    protected async destroyConnection(): Promise<void> {
        return void 0;
    }
    protected createPdoConnection(): PdoConnectionI {
        return new FakeConnection();
    }
    protected validateRawConnection(): boolean {
        return true;
    }
    protected async getVersionFromConnection(): Promise<string> {
        return '1.0.0';
    }
}

Pdo.addDriver('fake', FakePdoDriver);
Pdo.addDriver('mysql', FakePdoDriver);
Pdo.addDriver('sqlite', FakePdoDriver);
Pdo.addDriver('pgsql', FakePdoDriver);
Pdo.addDriver('sqlsrv', FakePdoDriver);
