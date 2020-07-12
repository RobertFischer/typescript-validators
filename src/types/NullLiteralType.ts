import Type from './Type'

import getErrorMessage from '../getErrorMessage'
import Validation, { ErrorTuple, IdentifierPath } from '../Validation'

export default class NullLiteralType extends Type<null> {
  typeName = 'NullLiteralType';

  *errors(
    validation: Validation<any>,
    path: IdentifierPath,
    input: any
  ): Generator<ErrorTuple, void, void> {
    if (input !== null) {
      yield [path, getErrorMessage('ERR_EXPECT_NULL'), this]
    }
  }

  accepts(input: any): boolean {
    return input === null
  }

  compareWith(input: Type<any>): -1 | 0 | 1 {
    if (input instanceof NullLiteralType) {
      return 0
    } else {
      return -1
    }
  }

  toString(): string {
    return 'null'
  }

  toJSON(): Record<string, any> {
    return {
      typeName: this.typeName,
    }
  }
}
