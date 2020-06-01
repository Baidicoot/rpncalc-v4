/*
EVAL.js
-------

reads exprs from AST and executes them

types of elem:
all have type
all have val

TYPE        VAL
"closure"   {scope:{}, args:['x', 'y'], defn:<function-like>}

<function-like>:
{type:"ins", ins:[]}
{type:"builtin", fn:(scope) => {stack}}

exported functionality:
defnOp(name, function) - define a built-in operator
evalRPN(scope, ast)
*/

let builtins = {};

export const defnOp = (name, data) => {
    builtins[name] = data;
}

const lookup = (name, scope) => {
    let n = scope[name];
    if (n) {
        return n;
    }
    n = builtins[n];
    if (n) {
        return n;
    }
    console.log(scope);
    throw '"' + name + '" not in scope'
}

const extend = (scope, name, elems) => {
    let o = Object.create(scope);
    o[name] = elems;
    return o;
}

const runFn = (defn, state) => {
    if (defn.type === "ins") {
        state.calls.push(defn.ins);
        state.stacks.push([]);
    } else if (defn.type === "builtin") {
        let scope = state.scopes.pop();
        let out = defn.fn(scope);
        state.calls.push([]);
        state.stacks.push(out);
    }
}

const giveArg = (arg, elem) => {
    let argN = elem.val.args[elem.val.args.length-1];
    let newscope = extend(elem.val.scope, argN, [arg]);
    return {type:elem.type, val:{scope:newscope, args:elem.val.args.slice(0,-1), defn:elem.val.defn}};
}

const apply = (elem, state) => {
    if (elem.type === "closure") {
        if (elem.val.args.length === 0) {
            state.scopes.push(elem.val.scope);
            runFn(elem.val.defn, state);
        } else if (state.stacks[state.stacks.length-1].length > 0) {
            apply(giveArg(state.stacks[state.stacks.length-1].pop(), elem), state);
        } else {
            state.stacks[state.stacks.length-1].push(elem);
        }
    } else {
        state.stacks[state.stacks.length-1].push(elem);
    }
}

const applyMany = (elems, state) => {
    for (let i = 0; i < elems.length; i++) {
        apply(elems[i], state);
    }
}

const makeStackElems = (ins, state) => {
    if (ins.type === "push") {
        throw 'nested push error'
    } else if (ins.type === "ident") {
        return lookup(ins.val, state.scopes[state.scopes.length-1]);
    } else if (ins.type === "func") {
        return [{type:"closure", val:{scope:state.scopes[state.scopes.length-1], args:ins.args, defn:{type:"ins", ins:ins.body}}}];
    } else {
        return [ins];
    }
}

const doIns = (ins, state) => {
    if (ins.type === "push") {
        state.stacks[state.stacks.length-1] = state.stacks[state.stacks.length-1].concat(makeStackElems(ins.elem, state));
    } else if (ins.type === "defn") {
        // initialize definition scope
        let defscope = Object.create(state.scopes[state.scopes.length-1]);
        // parse into closure for definition's scope (to allow for recursion)
        let fnForm = {type:"closure", val:{scope:defscope, args:[], defn:{type:"ins", ins:ins.defn}}};
        // add fnForm to definition scope
        defscope[ins.ident] = [fnForm];
        // evaluate fnForm
        let out = execRPN(defscope, ins.defn);
        defscope[ins.ident] = out.stacks[0];
        state.scopes[state.scopes.length-1] = defscope;
    } else {
        applyMany(makeStackElems(ins, state), state);
    }
}

const step = (state) => {
    if (state.calls[state.calls.length-1].length === 0) {
        if (state.calls.length === 1) {
            throw 'finished execution'
        }
        if (state.stacks.length < 2) {
            throw 'nothing to return'
        }
        state.calls.pop();
        let out = state.stacks.pop();
        applyMany(out, state);
    } else {
        let ins = state.calls[state.calls.length-1][0];
        state.calls[state.calls.length-1] = state.calls[state.calls.length-1].slice(1);
        doIns(ins, state);
    }
}

export const execRPN = (scope, ins) => {
    let state = {scopes:[scope], stacks:[[]], calls:[ins]};
    while (state.calls[0].length > 0 || state.calls.length > 1) {
        step(state);
        if (state.stacks.length > 4096) {
            throw 'max recursion depth exceeded'
        }
    }
    return state;
}