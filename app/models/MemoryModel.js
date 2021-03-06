'use strict';

const Model = require('@rezeus/model');
const _ = require('underscore');

// Memory data store. [idFieldName] -> record
/** @type {Map<String, Object>} */
const mem = new Map();

class MemoryModel extends Model {
  constructor() {
    super();

    if (this.constructor.name === MemoryModel.name) {
      throw new Error('Cannot create a new MemoryModel instance.');
    }
  }

  persist() {
    return new Promise((resolve/* , reject */) => {
      if (this.isNew) {
        // Create

        const json = this.toJSON();
        mem.set(this.id, json);

        resolve();
      } else if (this.isDirty) {
        // Update

        const changes = _.pick(this.toJSON(), this.getChangedFieldNames());

        const oldFields = mem.get(this.id);
        const newFields = {
          ...oldFields,
          ...changes,
        };
        mem.set(this.id, newFields);

        resolve();
      }
    });
  }

  static find(predicates = {}) {
    const predicateKeys = Object.keys(predicates);

    if (predicateKeys.length === 0) {
      return [...mem.values()].map((rec) => this.fromJSON(rec));
    }

    if (predicateKeys.length === 1 && predicateKeys[0] === this.idFieldName) {
      const foundFields = mem.get(predicates[this.idFieldName]);
      return this.fromJSON(foundFields);
    }

    // let id;
    // [...mem.entries()].findIndex(([cid, cval]) => {
    //   if (cval.baz === 'qux') {
    //     id = cid;
    //     return true;
    //   }
    //   return false;
    // });

    // if (!id) {
    //   return undefined;
    // }

    // return mem.get(id);

    return undefined;
  }

  static findById(id) {
    return this.find({ id });
  }

  static existsById(id) {
    return mem.has(id);
  }

  static updateById(id, updates) {
    let combined;

    if (mem.has(id)) {
      combined = {
        ...mem.get(id),
        ...updates,
      };
    } else {
      combined = { ...updates };
    }

    this.beforeUpdate();

    mem.set(id, combined);

    this.afterUpdate();
  }

  static deleteById(id) {
    // NOTE Return true if deleted, false otherwise (e.g. wasn't exist in the first place)
    return mem.delete(id);
  }

  afterCreate() {
    this.constructor.ee.emitAsync(`/models/${this.constructor.name.toLowerCase()}/created`, this);
  }

  afterUpdate(changedFieldNames) {
    this.constructor.ee.emitAsync(`/models/${this.constructor.name.toLowerCase()}/updated`, this, changedFieldNames);
  }
}

module.exports = MemoryModel;
