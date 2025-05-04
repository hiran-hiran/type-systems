import { parseArith } from "npm:tiny-ts-parser";

export type Type = { tag: "Boolean" } | { tag: "Number" };

export type Term =
  | { tag: "true" }
  | { tag: "false" }
  | { tag: "if"; cond: Term; thn: Term; els: Term }
  | { tag: "number"; n: number }
  | { tag: "add"; left: Term; right: Term };

function typecheck(t: Term): Type {
  switch (t.tag) {
    case "true":
      return { tag: "Boolean" };
    case "false":
      return { tag: "Boolean" };
    case "number":
      return { tag: "Number" };
    case "if": {
      const condTy = typecheck(t.cond);
      // if (condTy.tag !== "Boolean") {
      //   throw "Boolean Expected!";
      // }

      const thnTy = typecheck(t.thn);
      const elsTy = typecheck(t.els);
      if (thnTy.tag !== elsTy.tag) {
        throw "same type expected!";
      }
      return thnTy;
    }
    case "add": {
      const leftTy = typecheck(t.left);
      if (leftTy.tag !== "Number") {
        throw "Number Expected";
      }
      const rightTy = typecheck(t.right);
      if (rightTy.tag !== "Number") {
        throw "Number Expected";
      }
      return { tag: "Number" };
    }
    default:
      throw `Never reach: ${t satisfies never}`;
  }
}

// console.log(parseArith("1+2"));
// console.log(typecheck(parseArith("1+2")));
console.log(typecheck(parseArith("(true) ? true : false")));
// console.log(parseArith("1 ? true : 4"));
