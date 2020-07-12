import Type from './types/Type'
import makeJSONError from './errorReporting/makeJSONError'
import { weakSetAdd, weakSetDelete, weakSetHas } from './cyclic'

export type IdentifierPath = Array<string | number | symbol>

export type ErrorTuple = [IdentifierPath, string, Type<any>]

export default class Validation<T> {
  input: T

  path: IdentifierPath = []

  prefix = ''

  errors: ErrorTuple[] = []

  // Tracks whether we're in validation of cyclic objects.
  cyclic: WeakMap<Type<any>, WeakSet<any>> = new WeakMap()

  constructor(input: T) {
    this.input = input
  }

  inCycle(type: Type<any>, input: any): boolean {
    const tracked = this.cyclic.get(type)
    if (!tracked) {
      return false
    } else {
      return weakSetHas(tracked, input)
    }
  }

  startCycle(type: Type<any>, input: any): void {
    let tracked = this.cyclic.get(type)
    if (!tracked) {
      tracked = new WeakSet()
      this.cyclic.set(type, tracked)
    }
    weakSetAdd(tracked, input)
  }

  endCycle(type: Type<any>, input: any): void {
    const tracked = this.cyclic.get(type)
    if (tracked) {
      weakSetDelete(tracked, input)
    }
  }

  hasErrors(path?: IdentifierPath): boolean {
    if (path) {
      for (const [candidate] of this.errors) {
        if (matchPath(path, candidate)) {
          return true
        }
      }
      return false
    } else {
      return this.errors.length > 0
    }
  }

  addError(
    path: IdentifierPath,
    expectedType: Type<any>,
    message: string
  ): this {
    this.errors.push([path, message, expectedType])
    return this
  }

  clearError(path: IdentifierPath | null | undefined): boolean {
    let didClear = false
    if (path) {
      const errors = []
      for (const error of this.errors) {
        if (matchPath(path, error[0])) {
          didClear = true
        } else {
          errors.push(error)
        }
      }
      this.errors = errors
    } else {
      didClear = this.errors.length > 0
      this.errors = []
    }
    return didClear
  }

  resolvePath(path: IdentifierPath): any {
    return resolvePath(this.input, path)
  }
  toJSON(): any {
    return makeJSONError(this)
  }
}

const validIdentifierOrAccessor = /^[$A-Z_][0-9A-Z_$[\].]*$/i

export function stringifyPath(path: IdentifierPath): string {
  if (!path.length) {
    return 'Value'
  }
  const { length } = path
  const parts = new Array(length)
  for (let i = 0; i < length; i++) {
    const part = path[i]
    if (part === '[[Return Type]]') {
      parts[i] = 'Return Type'
    } else if (
      typeof part !== 'string' ||
      !validIdentifierOrAccessor.test(part)
    ) {
      parts[i] = `[${String(part)}]`
    } else if (i > 0) {
      parts[i] = `.${String(part)}`
    } else {
      parts[i] = String(part)
    }
  }
  return parts.join('')
}

export function resolvePath(input: any, path: IdentifierPath): any {
  let subject = input
  const { length } = path
  for (let i = 0; i < length; i++) {
    if (subject == null) {
      return undefined
    }
    const part = path[i]
    if (part === '[[Return Type]]') {
      continue
    }
    if (subject instanceof Map) {
      subject = subject.get(part)
    } else {
      subject = subject[part]
    }
  }
  return subject
}

export function matchPath(
  path: IdentifierPath,
  candidate: IdentifierPath
): boolean {
  const { length } = path
  if (length > candidate.length) {
    return false
  }
  for (let i = 0; i < length; i++) {
    if (candidate[i] !== path[i]) {
      return false
    }
  }
  return true
}
