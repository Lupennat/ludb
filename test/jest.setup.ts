import { Pdo } from 'lupdo';
import FakePdo from '../src/__tests__/fixtures/fake-pdo';

Pdo.addDriver('fake', FakePdo);
