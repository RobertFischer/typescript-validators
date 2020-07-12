import Type from './Type'
import StringLiteralType from './StringLiteralType'
import getErrorMessage from '../getErrorMessage'
import Validation, { ErrorTuple, IdentifierPath } from '../Validation'

export default class StringType extends Type<string> {
  typeName = 'StringType';

  *errors(
    validation: Validation<any>,
    path: IdentifierPath,
    input: any
  ): Generator<ErrorTuple, void, void> {
    if (typeof input !== 'string') {
      yield [path, getErrorMessage('ERR_EXPECT_STRING'), this]
    }
  }

  accepts(input: any): boolean {
    return typeof input === 'string'
  }

  compareWith(input: Type<any>): -1 | 0 | 1 {
    if (input instanceof StringLiteralType) {
      return 1
    } else if (input instanceof StringType) {
      return 0
    } else {
      return -1
    }
  }

  toString(): string {
    return 'string'
  }

  toJSON(): Record<string, any> {
    return {
      typeName: this.typeName,
    }
  }
}
