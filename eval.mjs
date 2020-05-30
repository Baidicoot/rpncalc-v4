/*
EVAL.js
-------

function definition object:
{nargs:0, defn:() => {}}

types of object on list:
{type:"int", val:0}
{type:"char", val:"0"}
{type:"closure", args:[], func:{}}
{type:"pair", val:{fst:{}, snd:{}}}

[{type:"int", val:1},{type:"int", val:1},{type:"builtin", op:"+"}]

[{type:"int", val:1},{type:"int", val:1},{type:"func", args:["a"], body:[{type:"ident", val:"a"},{type:"int", val:1},{type:"builtin", op:"+"}]}]

exported functions:
addDefn - adds a builtin function
doStep - consumes instruction stream, stack, outputs stack
execRPN - consumes scope, instruction stream, outputs stack
*/

const makeEval = (sign, defnarg) => {
    if (typeof sign === "number") {
        return {nargs:sign, defn:defnarg};
    } else {
        return {nargs:sign.length, defn:(scope, args) => {
                let stripped = [];
                for (let i = 0; i < sign.length; i++) {
                    if (args[i].type === sign[i]) {
                        stripped.push(args[i].val);
                    } else {
                        throw 'typeerror'
                    }
                }
                return defnarg(scope, stripped);
            }
        }
    }
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

const stop = (a, b) => {
    return [{type:"string", val:"stop"}];
}

let builtinDefn = {
    "+":        makeEval(["int", "int"], add),
    "-":        makeEval(["int", "int"], sub),
    "/":        makeEval(["int", "int"], div),
    "*":        makeEval(["int", "int"], mult),
    "==":       makeEval(2, eq),
    "typeof":   makeEval(1, type),
    "pair":     makeEval(2, pair),
    "fst":      makeEval(["pair"], fst),
    "snd":      makeEval(["pair"], snd)
}

export const addDefn = (name, sign, func) => {
    builtinDefn[name] = makeEval(sign, func);
}

export const addRPNASTDefn = (name, ast) => {
    builtinDefn[name] = makeLambda(ast);
}

const makeLambda = (lambda) => {
    return {nargs:lambda.args.length, defn:(scope, args) => {
        let newscope = Object.create(scope); // I am so sorry...
        for (let i = 0; i < lambda.args.length; i++) {
            newscope[lambda.args[i]] = args[i];
        }
        return execRPN(newscope, lambda.body).stack;
    }};
}

const makeObj = (elem) => {
    if (elem.type === "func") {
        return {type:"closure", args:[], func:makeLambda(elem)};
    } else {
        return elem;
    }
}

const cloneElem = (elem) => {
    if (elem.type === "closure") {
        let argsClone = [];
        for (let i = 0; i < elem.args.length; i++) {
            argsClone.push(cloneElem(elem.args[i]));
        }
        return {type:"closure", args:argsClone, func:elem.func};
    } else {
        return elem;
    }
}

const lookupScope = (name, scope) => {
    let n = scope[name];
    if (n) {
        return cloneElem(n);
    }
    n = builtinDefn[name];
    if (n) {
        return {type:"closure", args:[], func:n};
    } else {
        throw "var " + n + " not in scope"
    }
}

const giveArg = (closure, arg, scope) => {
    closure.args.push(arg);
    if (closure.args.length === closure.func.nargs) {
        return closure.func.defn(scope, closure.args);
    } else {
        return [closure];
    }
}

const apply = (elem, stack) => {
    if (elem.type === "closure") {
        if (elem.func.nargs === 0) {
            applyMany(elem.func.defn(stack.scope, []), stack);
        } else if (stack.stack.length > 0) {
            let out = giveArg(elem, stack.stack.pop(), stack.scope);
            applyMany(out, stack);
        } else {
            stack.stack.push(elem);
        }
    } else if (elem.type === "ident") {
        let id = lookupScope(elem.val, stack.scope);
        apply(id, stack);
    } else {
        stack.stack.push(elem);
    }
}

const applyMany = (outstack, stack) => {
    for (let i = 0; i < outstack.length; i++) {
        apply(outstack[i], stack);
    }
}

const pushS = (elem, stack) => {
    if (elem.type === "ident") {
        let id = lookupScope(elem.val, stack.scope);
        stack.stack.push(id);
    } else {
        stack.stack.push(elem);
    }
}

const defn = (elem, name, stack) => {
    stack.scope[name] = makeObj(elem);
}

export const doStep = (ins, stack) => {
    let instruction = ins.shift();
    if (instruction.type === "push") {
        pushS(makeObj(instruction.elem), stack);
    } else if (instruction.type === "defn") {
        defn(instruction.defn, instruction.ident, stack);
    } else {
        apply(makeObj(instruction), stack);
    }
}

export const execRPN = (scope, i) => {
    let ins = JSON.parse(JSON.stringify(i));
    let stack = {scope:scope, stack:[]};
    while (ins.length > 0) {
        doStep(ins, stack);
    }
    return stack;
}