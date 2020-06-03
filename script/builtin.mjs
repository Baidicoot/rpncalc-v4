import {defnOp, makeOp} from './shiny.mjs';

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

export const assertType = (type) => (elem) => {
    if (elem.type !== type) {
        throw 'typeerror'
    }
}

export const addDefn = (name, args, fn) => {
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

const add = (args) => [{type:"num", val:args[0] + args[1]}];
const sub = (args) => [{type:"num", val:args[0] - args[1]}];
const div = (args) => [{type:"num", val:args[0] / args[1]}];
const mult = (args) => [{type:"num", val:args[0] * args[1]}];
const pow = (args) => [{type:"num", val:Math.pow(args[0], args[1])}];
const root = (args) => [{type:"num", val:Math.sqrt(args[0])}];
const type = (args) => [{type:"type", val:args[0].type}];
const index = (args) => [args[0][args[1]]];
const len = (args) => [{type:"num", val:args[0].length}];
const untuple = (args) => args[0];

const coerce = (args) => {
    if (args[1].type === "type") {
        return [{type:args[1].val, val:args[0].val}];
    } else {
        throw 'typeerror'
    }
}

const tuple = (args) => makeOp([...Array(args[0]).keys()], (iargs) => {
    let arr = [];
    for (let i = 0; i < args[0]; i++) {
        arr.push(iargs[i][0]);
    }
    return [{type:"tuple", val:arr}]
});

const eq = (args) => {
    console.log(args[2], args[3])
    if (args[2].type === args[3].type && objEq(args[2].val, args[3].val)) {
        return [args[0]];
    } else {
        return [args[1]];
    }
}

addDefn("+", ["num", "num"], add);
addDefn("-", ["num", "num"], sub);
addDefn("/", ["num", "num"], div);
addDefn("*", ["num", "num"], mult);
addDefn("^", ["num", "num"], pow);
addDefn("sqrt", ["num"], root);
addDefn("==", 4, eq);
addDefn("tuple", ["num"], tuple);
addDefn("!!", ["tuple", "num"], index);
addDefn("len", ["tuple"], len);
addDefn("untuple", ["tuple"], untuple);
addDefn("typeof", 1, type);
addDefn("coerce", 2, coerce);