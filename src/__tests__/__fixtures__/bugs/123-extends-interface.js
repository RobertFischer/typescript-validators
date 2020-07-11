/* @flow */

import type TypeContext from "../../../TypeContext";

export function pass(t: TypeContext) {
  const A = t.type("A", t.object(t.property("a", t.number())));
  const B = t.type("B", t.object(t.property("b", t.string())));
  const C = t.type("C", t.spread(A, B));

  return C.assert({
    a: 123,
    b: "foo bar"
  });
}

export function fail(t: TypeContext) {
  const A = t.type("A", t.object(t.property("a", t.number())));
  const B = t.type("B", t.object(t.property("b", t.string())));
  const C = t.type("C", t.spread(A, B));
  return C.assert({
    a: 123,
    b: 0
  });
}
