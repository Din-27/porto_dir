const comparisonOperator = new Map([
  ['!=', '$ne'],
  ['>', '$gt'],
  ['>=', '$gte'],
  ['<', '$lt'],
  ['<=', '$lte'],
]);

export default class QueryParser {
  sort = {};

  projection = {};

  query = {
    $match: {},
  };

  select(...fields) {
    for (let i = 0; i < fields.length; i += 1) {
      if (typeof fields[i] === 'object') {
        const objectKeys = Object.keys(fields[i]);
        for (let j = 0; j < objectKeys.length; j += 1) {
          const key = objectKeys[j];
          this.projection[key] = fields[i][key];
        }
      } else {
        this.projection[fields[i]] = 1;
      }
    }

    return this;
  }

  where(field, operator, value) {
    if (operator === '=') {
      this.query.$match[field] = value;
    } else if (comparisonOperator.has(operator)) {
      const opr = comparisonOperator.get(operator);
      this.query.$match[field] = {};
      this.query.$match[field][opr] = value;
    } else {
      throw new Error('Not valid operator');
    }
    return this;
  }

  whereIn(field, value) {
    this.query.$match[field] = { $in: value };
    return this;
  }

  whereNotIn(field, value) {
    this.query.$match[field] = { $nin: value };
    return this;
  }

  whereRaw(field, value) {
    this.query.$match[field] = value;
    return this;
  }

  /**
   *
   * @param {string} field
   * @param {'asc' | 'desc'} type
   */
  orderBy(field, type) {
    this.sort[field] = type === 'asc' ? 1 : -1;
    return this;
  }
}
