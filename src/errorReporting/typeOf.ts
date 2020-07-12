function keyToString(key: string | number | symbol): string {
  switch (typeof key) {
    case 'symbol':
      return `[${String(key)}]`
    case 'number':
      return String(key)
    case 'string':
      if (/^[_a-z][_a-z0-9]*$/i.test(key)) return key
  }
  return JSON.stringify(key)
}

export default function typeOf(value: any): string {
  if (value == null) return String(value)
  if (typeof value !== 'object') return typeof value
  if (value.constructor && value.constructor !== Object)
    return value.constructor.name
  return `{\n${Object.keys(value)
    .map(key => `  ${keyToString(key)}: ${typeOf(value[key])}`)
    .join(',\n')}\n}`
}
