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

const fst = (args) => [args[0].fst];

const snd = (args) => [args[0].snd];

let builtinDefn = {
    "+":        makeEval(["int", "int"], add),
    "-":        makeEval(["int", "int"], sub),
    "/":        makeEval(["int", "int"], div),
    "*":        makeEval(["int", "int"], mult),
    "typeof":   makeEval(1, type),
    "pair":     makeEval(2, pair),
    "fst":      makeEval(["pair"], fst),
    "snd":      makeEval(["pair"], snd)
}

const addDefn = (name, sign, func) => {
    builtinDefn[name] = makeEval(sign, func);
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
    if (elem.type === "builtin") {
        let fn = builtinDefn[elem.op];
        return {type:"closure", args:[], func:fn};
    } else if (elem.type === "func") {
        return {type:"closure", args:[], func:makeLambda(elem)};
    } else {
        return elem;
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
        let out = giveArg(elem, stack.stack.pop(), stack.scope);
        applyMany(out, stack);
    } else if (elem.type === "ident") {
        let id = stack.scope[elem.val];
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
        let id = stack.scope[elem.name];
        stack.stack.push(id);
    } else {
        stack.stack.push(elem);
    }
}

const defn = (elem, name, stack) => {
    stack.scope[name] = makeObj(elem);
}

const doStep = (ins, stack) => {
    let instruction = ins.shift();
    if (instruction.type === "push") {
        pushS(makeObj(instruction.elem), stack);
    } else if (instruction.type === "defn") {
        defn(ins.defn, ins.ident, stack);
    } else {
        apply(makeObj(instruction), stack);
    }
}

const execRPN = (scope, ins) => {
    let stack = {scope:scope, stack:[]};
    while (ins.length > 0) {
        doStep(ins, stack);
    }
    return stack;
}