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

exported functions:
makeEval - lifts a function to a function definition object
doStep - consumes instruction stream, stack, outputs stack
execRPN - consumes scope, instruction stream, outputs stack
*/

const makeEval = (sign, defn) => {
    if (typeof sign === "number") {
        return {nargs:sign, defn:defn};
    } else {
        return {nargs:sign.length, defn:(scope, args) => {
                let stripped = [];
                for (let i = 0; i < sign.length; i++) {
                    if (args[i].type === sign[i].type) {
                        stripped.push(args[i].val);
                    } else {
                        throw 'typeerror'
                    }
                }
                defn(scope, stripped);
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

const builtinDefn = {
    "+":        makeEval(["int", "int"], add),
    "-":        makeEval(["int", "int"], sub),
    "/":        makeEval(["int", "int"], div),
    "*":        makeEval(["int", "int"], mult),
    "typeof":   makeEval(1, type),
    "pair":     makeEval(2, pair),
    "fst":      makeEval(["pair"], fst),
    "snd":      makeEval(["pair"], snd)
}

const makeLambda = (lambda) => (scope, args) => {
    let newscope = Object.create(scope); // I am so sorry...
    for (let i = 0; i < lambda.args.length; i++) {
        newscope[lambda.args[i]] = args[i];
    }
    return execRPN(newscope, lambda.body);
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
        return closure.defn(scope, closure.args)
    } else {
        return [closure];
    }
}

const apply = (elem, stack) => {
    if (elem.type === "closure") {
        let out = elem.giveArg(elem, stack.stack.pop(), stack.scope);
        applyMany(out, stack);
    } else {
        stack.push(elem);
    }
}

const applyMany = (outstack, stack) => {
    for (let i = 0; i < outstack.length; i++) {
        apply(outstack[i], stack);
    }
}

const doStep = (ins, stack) => {
    let elem = makeObj(ins.pop());
    apply(elem, stack);
}

const execRPN = (scope, ins) => {
    let stack = {scope:scope, stack:[]};
    while (ins.length > 0) {
        doStep(ins, stack);
    }
}