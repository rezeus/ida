'use strict';

const bcrypt = require('bcrypt');

const MemoryModel = require('./MemoryModel');

class User extends MemoryModel {
  /**
   * @returns {Array<String>}
   */
  static get jsonExcludedFieldNames() {
    return [
      'password',
    ];
  }

  // Fields
  //
  /** @type {String} */
  get email() {
    return this.getField('email');
  }

  /** @param {String} newVal */
  set email(newVal) {
    this.setField('email', newVal);
  }

  /** @type {String} */
  get firstname() {
    return this.getField('firstname');
  }

  /** @param {String} newVal */
  set firstname(newVal) {
    this.setField('firstname', newVal);
  }

  /** @type {String} */
  get lastname() {
    return this.getField('lastname');
  }

  /** @param {String} newVal */
  set lastname(newVal) {
    this.setField('lastname', newVal);
  }

  /** @type {String} */
  get password() {
    return this.getField('password');
  }

  /** @param {String} newVal */
  set password(newVal) {
    this.setField('password', bcrypt.hashSync(newVal, 12));
  }

  // NOTE Classes may have define their own methods
  isPasswordValid(password) {
    return bcrypt.compareSync(password, this.password);
  }

  // Virtual Fields
  //
  /** @type {String} */
  get name() {
    return `${this.getField('firstname')} ${this.getField('lastname')}`;
  }

  /** @param {String} newVal */
  set name(newVal) {
    const separateIndex = newVal.lastIndexOf(' ');

    if (separateIndex < 0) {
      throw new Error('Invalid name value - it MUST have a space to separate first and last names.');
    }

    this.setField('firstname', newVal.substring(0, separateIndex));
    this.setField('lastname', newVal.substring(separateIndex + 1));
  }
}

module.exports = User;
