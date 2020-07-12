/* @flow */

import Type from './Type'
import NullableType from './NullableType'
import compareTypes from '../compareTypes'
import getErrorMessage from '../getErrorMessage'
import {
  addConstraints,
  collectConstraintErrors,
  constraintsAccept,
} from '../typeConstraints'

import { TypeConstraint } from '.'
import Validation, { ErrorTuple, IdentifierPath } from '../Validation'

export default class ObjectTypeProperty<
  K extends string | number | symbol,
  V
> extends Type<V> {
  typeName = 'ObjectTypeProperty'
  key: K
  value: Type<V>
  optional: boolean
  // @flowIgnore
  'static' = false
  constraints: TypeConstraint<V>[] = []

  constructor(key: K, value: Type<V>, optional: boolean) {
    super()
    this.key = key
    this.value = value
    this.optional = optional
  }

  addConstraint(...constraints: TypeConstraint<V>[]): ObjectTypeProperty<K, V> {
    addConstraints(this, ...constraints)
    return this
  }

  /**
   * Determine whether the property is nullable.
   */
  isNullable(): boolean {
    return this.value instanceof NullableType
  }

  /**
   * Determine whether the property exists on the given input or its prototype chain.
   */
  existsOn(input: Record<string, any>): boolean {
    // @flowIgnore
    const { key, static: isStatic } = this
    return key in (isStatic ? input.constructor : input) === true
  }

  *errors(
    validation: Validation<any>,
    path: IdentifierPath,
    input: any
  ): Generator<ErrorTuple, void, void> {
    // @flowIgnore
    const { optional, key, value, static: isStatic } = this
    let target
    let targetPath
    if (isStatic) {
      if (
        input === null ||
        (typeof input !== 'object' && typeof input !== 'function')
      ) {
        yield [path, getErrorMessage('ERR_EXPECT_OBJECT'), this]
        return
      }
      targetPath = path.concat('constructor')
      if (typeof input.constructor !== 'function') {
        if (!optional) {
          yield [targetPath, getErrorMessage('ERR_EXPECT_FUNCTION'), this]
        }
        return
      }
      targetPath.push(key)
      target = input.constructor[key]
    } else {
      target = input[key]
      targetPath = path.concat(key)
    }
    if (optional && target === undefined) {
      return
    }
    if (this.isNullable() && !this.existsOn(input)) {
      yield [targetPath, getErrorMessage('ERR_MISSING_PROPERTY'), this]
      return
    }
    let hasErrors = false
    for (const error of value.errors(validation, targetPath, target)) {
      hasErrors = true
      yield error
    }
    if (!hasErrors) {
      yield* collectConstraintErrors(this, validation, targetPath, target)
    }
  }

  accepts(input: Record<K, V>): boolean {
    // @flowIgnore
    const { optional, key, value, static: isStatic } = this
    let target
    if (isStatic) {
      if (
        input === null ||
        (typeof input !== 'object' && typeof input !== 'function')
      ) {
        return false
      }
      if (typeof input.constructor !== 'function') {
        return optional ? true : false
      }
      target = (input as any).constructor[key]
    } else {
      target = input[key]
    }

    if (optional && target === undefined) {
      return true
    }

    if (this.isNullable() && !this.existsOn(input)) {
      return false
    }

    if (!value.accepts(target)) {
      return false
    } else {
      return constraintsAccept(this, target)
    }
  }

  compareWith(input: Type<any>): -1 | 0 | 1 {
    if (!(input instanceof ObjectTypeProperty)) {
      return -1
    } else if (input.key !== this.key) {
      return -1
    } else {
      return compareTypes(this.value, input.value)
    }
  }

  toString(): string {
    let key: any = this.key
    if (typeof key === 'symbol') {
      key = `[${key.toString()}]`
    }
    if (this.static) {
      return `static ${key}${
        this.optional ? '?' : ''
      }: ${this.value.toString()};`
    } else {
      return `${key}${this.optional ? '?' : ''}: ${this.value.toString()};`
    }
  }

  toJSON(): Record<string, any> {
    return {
      typeName: this.typeName,
      key: this.key,
      value: this.value,
      optional: this.optional,
    }
  }
}
