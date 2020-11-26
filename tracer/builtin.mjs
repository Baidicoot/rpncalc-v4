import {defnOp, makeOp, defn} from './shiny.mjs';
import {parseExprs} from './parse.mjs';
import {tokenize} from './token.mjs';

const objEq = (a, b) => {
    if (typeof a !== 'object' && typeof b !== 'object') {
        return a === b;
    } else if (typeof a !== 'object' || typeof b !== 'object') {
        return false;
    } else {
        const aprop = Object.getOwnPropertyNames(a);
        const bprop = Object.getOwnPropertyNames(b);

        if (bprop.length !== aprop.length) {
            return false;
        }

        for (let i = 0; i < aprop.length; i++) {
            if (!objEq(a[aprop[i]], b[aprop[i]])) {
                return false;
            }
        }

        return true;
    }
}

export let scope = {};

export const customHandler = (ins) => {
    return [ins];
}

const addRPNDefn = (name, def) => {
    let toks = tokenize(def);
    if (!toks) {
        throw 'could not load builtin'
    }
    toks = toks.map(elem => {
        elem.startPos = 0;
        elem.endPos = 0;
        return elem;
    });
    let ast = parseExprs(toks);
    if (!ast.parsed) {
        throw 'could not load builtin'
    }
    scope = defn(name, ast.parsed.arr, scope);
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

const addConst = (name, typ, val) => {
    defnOp(name, [{type:typ, val:val}])
}

const unary = (fn, outty) => (args) => [{type:outty, val:fn(args[0])}]
const binary = (fn, outty) => (args) => [{type:outty, val:fn(args[0], args[1])}]

const add = (args) => [{type:"num", val:args[0] + args[1]}];
const sub = (args) => [{type:"num", val:args[0] - args[1]}];
const div = (args) => [{type:"num", val:args[0] / args[1]}];
const mult = (args) => [{type:"num", val:args[0] * args[1]}];
const pow = (args) => [{type:"num", val:Math.pow(args[0], args[1])}];
const root = (args) => [{type:"num", val:Math.sqrt(args[0])}];
const type = (args) => [{type:"type", val:args[0].type}];
const pair = (args) => [{type:"pair", val:{fst:args[0], snd:args[1]}}];
const fst = (args) => [args[0].fst];
const snd = (args) => [args[0].snd];
const tuple = (args) => makeOp([...Array(args[0]).keys()], (args) => {return [{type:"tuple", val:args}]});
const index = (args) => args[0][args[1]];
const len = (args) => [{type:"num", val:args[0].length}];

const eq = (args) => {
    if (args[2].type === args[3].type && objEq(args[2].val, args[3].val)) {
        return [args[0]];
    } else {
        return [args[1]];
    }
}

const coerce = (args) => [{type:args[1].val, val:args[0].val}]

addConst("pi", "num", Math.PI);
addConst("e", "num", Math.E);
addDefn("+", ["num", "num"], add);
addDefn("-", ["num", "num"], sub);
addDefn("/", ["num", "num"], div);
addDefn("*", ["num", "num"], mult);
addDefn("^", ["num", "num"], pow);
addDefn("sin", ["num"], unary(Math.sin, "num"));
addDefn("cos", ["num"], unary(Math.cos, "num"));
addDefn("tan", ["num"], unary(Math.tan, "num"));
addDefn("asin", ["num"], unary(Math.asin, "num"));
addDefn("acos", ["num"], unary(Math.acos, "num"));
addDefn("atan", ["num"], unary(Math.atan, "num"));
addDefn("ln", ["num"], unary(Math.log, "num"));
addDefn("coerce", 2, coerce)
addDefn("sqrt", ["num"], root);
addDefn("==", 4, eq);
addDefn("pair", 2, pair);
addDefn("fst", ["pair"], fst);
addDefn("snd", ["pair"], snd);
addDefn("tuple", ["num"], tuple);
addDefn("!!", ["tuple", "num"], index);
addDefn("len", ["tuple"], len);
addDefn("typeof", 1, type);
addRPNDefn("stop", "\"stop");
addRPNDefn("inv", "(x -> 1 x /)");
addRPNDefn("fold", "(x acc fn -> acc '(-> x acc fn 'fn fold) 'x stop ==)");
addRPNDefn("range", "(x y -> x '(->x x 1 + y range) 'x y ==)");
addRPNDefn("listthen", "(fn -> (internal; x acc -> '(->acc fn) '(->x acc pair internal) x stop ==) 0 tuple internal)");
addRPNDefn("list", "'(a -> a) listthen");
addRPNDefn("lmap", "(list fn -> list '(->list fst fn list snd 'fn lmap pair) list 0 tuple ==)");
addRPNDefn("unlist", "(l -> (internal; list -> '(->) '(->list fst list snd internal) list 0 tuple ==) stop l internal)");
addRPNDefn("map", "fn -> '(l->l 'fn lmap unlist) listthen");