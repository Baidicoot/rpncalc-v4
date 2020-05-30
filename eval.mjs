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

export const makeFn = (sign, defnarg) => {
    return {type:"closure", args:[], func:makeEval(sign, defnarg)};
}

let builtinDefn = {};

export const addDefn = (name, sign, func) => {
    builtinDefn[name] = makeFn(sign, func);
}

export const addRPNASTDefn = (name, ast) => {
    builtinDefn[name] = makeObj(ast);
}

const makeLambda = (lambda) => {
    return {nargs:lambda.args.length, defn:(scope, args) => {
        let newscope = Object.create(scope);
        for (let i = 0; i < lambda.args.length; i++) {
            newscope[lambda.args[i]] = args[args.length-1-i];
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
        return cloneElem(n);
    } else {
        throw 'var "' + name + '" not in scope'
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

const doStep = (ins, stack) => {
    let instruction = ins.shift();
    if (instruction.type === "push") {
        pushS(makeObj(instruction.elem), stack);
    } else if (instruction.type === "defn") {
        defn(instruction.defn, instruction.ident, stack);
    } else {
        apply(makeObj(instruction), stack);
    }
}

const showIns = (curr) => {
    if (curr.type === "ident") {
        return curr.val;
    } else if (curr.type === "push") {
        return "'" + showIns(curr.elem)
    }
}

export const execRPN = (scope, i) => {
    let ins = JSON.parse(JSON.stringify(i));
    let stack = {scope:scope, stack:[]};
    while (ins.length > 0) {
        let curr = ins[0];
        try {
            doStep(ins, stack);
        } catch (error) {
            throw error + ' while executing "' + showIns(curr) + '"'
        }
    }
    return stack;
}