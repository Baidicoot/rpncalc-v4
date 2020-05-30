import {addDefn, addRPNASTDefn} from './eval.mjs';
import {parseExprs} from './parse.mjs';
import {tokenize} from './token.mjs';

const addRPNDefn = (name, def) => {
    let toks = tokenize(def);
    if (!toks) {
        throw 'could not load builtin'
    }
    let ast = parseExprs(toks);
    if (!ast.parsed) {
        throw 'could not load builtin'
    }
    addRPNASTDefn(name, ast.parsed[0]);
}

const add = (_, args) => {
    return [{type:"int", val:args[0] + args[1]}];
}

const sub = (_, args) => {
    return [{type:"int", val:args[1] - args[0]}];
}

const div = (_, args) => {
    return [{type:"int", val:args[1] / args[0]}];
}

const mult = (_, args) => {
    return [{type:"int", val:args[0] * args[1]}];
}

const pow = (_, args) => {
    return [{type:"int", val:Math.pow(args[1], args[0])}];
}

const root = (_, args) => {
    return [{type:"int", val:Math.sqrt(args[0])}];
}

const type = (_, args) => {
    return [{type:"string", val:args[0].type}];
}

const pair = (_, args) => {
    return [{type:"pair", val:{fst:args[0], snd:args[1]}}];
}

const fst = (_, args) => [args[0].fst];

const snd = (_, args) => [args[0].snd];

const eq = (_, args) => {
    if (args[0].type === args[1].type && args[0].val === args[1].val) {
        return [{type:"ident", val:"true"}];
    } else {
        return [{type:"ident", val:"false"}];
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
addRPNDefn("true", "(a b -> a)");
addRPNDefn("false", "(a b -> b)");
addRPNDefn("stop", "(-> \"stop)");
addRPNDefn("id", "(a -> a)");
addRPNDefn("inv", "(x -> 1 x /)");
addRPNDefn("fold", "(fn acc x -> '(-> x acc fn 'fn fold) '(-> acc) 'x \"stop ==)");