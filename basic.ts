import { parseBasic } from "npm:tiny-ts-parser";

type Type =
  | { tag: "Boolean" }
  | { tag: "Number" }
  | { tag: "Func"; params: Param[]; retType: Type };

type Param = { name: string; type: Type };

type Term =
  | { tag: "true" }
  | { tag: "false" }
  | { tag: "if"; cond: Term; thn: Term; els: Term }
  | { tag: "number"; n: number }
  | { tag: "add"; left: Term; right: Term }
  | { tag: "var"; name: string }
  | { tag: "func"; params: Param[]; body: Term }
  | { tag: "call"; func: Term; args: Term[] }
  | { tag: "seq"; body: Term; rest: Term }
  | { tag: "const"; name: string; init: Term; rest: Term };

type TypeEnv = Record<string, Type>;

const typeEq = (ty1: Type, ty2: Type) => {
  switch (ty2.tag) {
    case "Boolean":
      return ty1.tag === "Boolean";
    case "Number":
      return ty1.tag === "Number";
    case "Func":
      if (ty1.tag !== "Func") return false;
      if (ty1.params.length !== ty2.params.length) return false;
      ty1.params.forEach((_, i) => {
        if (!typeEq(ty1.params[i].type, ty2.params[i].type)) return false;
      });
      if (!typeEq(ty1.retType, ty2.retType)) return false;
      return true;
  }
};

function typecheck(t: Term, tyEnv: TypeEnv): Type {
  switch (t.tag) {
    case "true":
      return { tag: "Boolean" };
    case "false":
      return { tag: "Boolean" };
    case "number":
      return { tag: "Number" };
    case "if": {
      const condTy = typecheck(t.cond, tyEnv);
      if (condTy.tag !== "Boolean") throw "boolean expected";
      const thnTy = typecheck(t.thn, tyEnv);
      const elsTy = typecheck(t.els, tyEnv);
      if (!typeEq(thnTy, elsTy)) {
        throw "then and else have different types";
      }
      return thnTy;
    }
    case "add": {
      const leftTy = typecheck(t.left, tyEnv);
      if (leftTy.tag !== "Number") throw "number expected";
      const rightTy = typecheck(t.right, tyEnv);
      if (rightTy.tag !== "Number") throw "number expected";
      return { tag: "Number" };
    }
    case "var": {
      if (tyEnv[t.name] === undefined) throw `unknown variable: ${t.name}`;
      return tyEnv[t.name];
    }
    case "func": {
      // console.log({ t, tyEnv });

      const newTyEnv = { ...tyEnv };
      for (const { name, type } of t.params) {
        newTyEnv[name] = type;
      }
      const retType = typecheck(t.body, newTyEnv);
      return { tag: "Func", params: t.params, retType };
    }

    case "call": {
      // console.log({ tyEnv });

      const funcTy = typecheck(t.func, tyEnv);
      if (funcTy.tag !== "Func") throw "function type expected";
      if (funcTy.params.length !== t.args.length) {
        throw "wrong number of arguments";
      }
      for (let i = 0; i < t.args.length; i++) {
        const argTy = typecheck(t.args[i], tyEnv);
        if (!typeEq(argTy, funcTy.params[i].type)) {
          throw "parameter type mismatch";
        }
      }
      return funcTy.retType;
    }

    case "seq": {
      typecheck(t.body, tyEnv);
      return typecheck(t.rest, tyEnv);
    }

    case "const": {
      const ty = typecheck(t.init, tyEnv);
      const newTyEnv = { ...tyEnv, [t.name]: ty };
      return typecheck(t.rest, newTyEnv);
    }

    default:
      console.log({ t });
      throw new Error(`not implemented - ${t satisfies never}`);
  }
}

// const node = parseBasic("(f: (x: number) => number) => 2");
const node = parseBasic(`
  const aaa = (x: number, y: number) => x + y;
  const b = false;
  aaa(1, aaa(1, 2))
`);
// const node = parseBasic("((x: number) => x)(1)");
// const node = parseBasic("((x: number) => x)(1)");
// const node = parseBasic("1()");
// const node = parseBasic("1");
// console.log({ node });
console.log(typecheck(node, {}));
