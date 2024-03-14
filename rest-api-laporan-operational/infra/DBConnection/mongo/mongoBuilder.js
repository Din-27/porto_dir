import DriverAdapter from './DriverAdapter.js';
import QueryBuilder from './QueryBuilder.js';

export default function mongoBuilder(dbName = 'default') {
  const driver = new DriverAdapter(dbName);
  return function queryBuilderFactory(collection) {
    return new QueryBuilder({ collection, driver });
  };
}
