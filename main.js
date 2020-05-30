import {execRPN} from './eval.mjs';
import {parseExprs} from './parse.mjs';
import {tokenize} from './token.mjs';
import './builtin.mjs';

const inbox = document.getElementById("inbox")
const outbox = document.getElementById("outbox")
const submit = document.getElementById("submit")

const show = (elem) => {
    if (elem.type === "int") {
        return elem.val
    } else if (elem.type === "pair") {
        return "{" + show(elem.val.fst) + ", " + show(elem.val.snd) + "}"
    } else if (elem.type === "closure") {
        return "(args: {" + prettyprint(elem.args) + "} of " + elem.func.nargs + ")"
    } else if (elem.type === "string") {
        return elem.val
    } else if (elem.type === "array") {
        return "[" + prettyprint(elem.val) + "]"
    }
}

const prettyprint = (out) => {
    let str = "";
    for (let i = 0; i < out.length; i++) {
        str += show(out[i]);
        if (i < out.length - 1) {
            str += " ";
        }
    }
    return str;
}

submit.onclick = (event) => {
    const input = inbox.value;
    let toks = tokenize(input);
    if (!toks) {
        outbox.innerHTML = "could not parse input: " + input;
        return;
    }
    let ast = parseExprs(toks);
    if (!ast.parsed) {
        outbox.innerHTML = "incorrect syntax somewhere";
        return;
    }
    console.log(ast.parsed);
    let out = execRPN({}, ast.parsed);
    if (!out) {
        outbox.innerHTML = "failed to execute";
        return;
    }
    console.log(out);
    outbox.innerHTML = prettyprint(out.stack);
}