import {defnOp, makeOp, defn, execRPN} from './shiny.mjs';
import {parseExprs} from './parse.mjs';
import {tokenize} from './token.mjs';

export let scope = {};

const addRPNDefn = (name, def) => {
    let toks = tokenize(def);
    if (!toks) {
        throw 'could not load builtin'
    }
    let ast = parseExprs(toks);
    if (!ast.parsed) {
        throw 'could not load builtin'
    }
    scope = defn(name, ast.parsed, scope);
}

const ast = (def) => {
    let toks = tokenize(def);
    if (!toks) {
        throw 'could not load builtin'
    }
    let ast = parseExprs(toks);
    if (!ast.parsed) {
        throw 'could not load builtin'
    }
    return execRPN({}, ast.parsed).stacks[0];
}

const ASTs = {
    "true":ast("(a b -> b)"),
    "false":ast("(a b -> b)"),
}

const assertType = (type) => (elem) => {
    if (elem.type !== type) {
        throw 'typeerror'
    }
}

const addDefn = (name, args, fn) => {
    if (Array.isArray(args)) {
        const nargs = [...Array(args.length).keys()];
        const liftFn = (scope) => {
            let newscope = Object.create(scope);
            for (let i = 0; i < args.length; i++) {
                assertType(args[i])(scope[i][0]);
                newscope[i] = scope[i][0].val;
            }
            return fn(newscope);
        }
        const op = makeOp(nargs, liftFn);
        defnOp(name, op);
    } else {
        const nargs = [...Array(args).keys()];
        const liftFn = (scope) => {
            let newscope = Object.create(scope);
            for (let i = 0; i < args; i++) {
                newscope[i] = scope[i][0];
            }
            return fn(newscope);
        }
        const op = makeOp(nargs, liftFn);
        defnOp(name, op);
    }
}

const add = (args) => {
    return [{type:"int", val:args[0] + args[1]}];
}

const sub = (args) => {
    return [{type:"int", val:args[1] - args[0]}];
}

const div = (args) => {
    return [{type:"int", val:args[1] / args[0]}];
}

const mult = (args) => {
    return [{type:"int", val:args[0] * args[1]}];
}

const pow = (args) => {
    return [{type:"int", val:Math.pow(args[1], args[0])}];
}

const root = (args) => {
    return [{type:"int", val:Math.sqrt(args[0])}];
}

const type = (args) => {
    return [{type:"type", val:args[0].type}];
}

const pair = (args) => {
    return [{type:"pair", val:{fst:args[0], snd:args[1]}}];
}

const fst = (args) => [args[0].fst];

const snd = (args) => [args[0].snd];

const eq = (args) => {
    if (args[0].type === args[1].type && args[0].val === args[1].val) {
        console.log(args[0], args[1])
        return ASTs["true"];
    } else {
        return ASTs["false"];
    }
}

const tuple = (args) => {
    return [makeFn(args[0], (_, args) => {return [{type:"tuple", val:args}]})];
}

const index = (args) => {
    return [args[0][args[1]]];
}

const len = (args) => {
    return [{type:"int", val:args[0].length}];
}

const coerce = (args) => {
    if (args[0].type === "type") {
        let o = {type:args[1].val, val:args[0].val};
        return [o];
    } else {
        throw 'typeerror'
    }
}

addDefn("+", ["int", "int"], add);
addDefn("-", ["int", "int"], sub);
addDefn("/", ["int", "int"], div);
addDefn("*", ["int", "int"], mult);
addDefn("^", ["int", "int"], pow);
addDefn("sqrt", ["int"], root);
addDefn("==", 2, eq);
addDefn("typeof", 1, type);
addDefn("pair", 2, pair);
addDefn("fst", ["pair"], fst);
addDefn("snd", ["pair"], snd);
addDefn("tuple", ["int"], tuple);
addDefn("!!", ["tuple", "int"], index);
addDefn("len", ["tuple"], len);
addDefn("unsafeCoerce", 2, coerce);
//addRPNDefn("unit", "(-> 0 arr)");
//addRPNDefn("mono", "(-> 1 arr)");
//addRPNDefn("unwrap", "(-> 0 !!)");
addRPNDefn("true", "(a b -> a)");
addRPNDefn("false", "(a b -> b)");
addRPNDefn("stop", "\"stop");
//addRPNDefn("id", "(a -> a)");
addRPNDefn("inv", "(x -> 1 x /)");
addRPNDefn("fold", "(x acc fn -> acc '(-> x acc fn 'fn fold) 'x \"stop ==)");