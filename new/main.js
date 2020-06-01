import {execRPN} from './shiny.mjs';
import {parseExprs} from './parse.mjs';
import {tokenize} from './token.mjs';
import {scope} from './builtin.mjs';

const inbox = document.getElementById("inbox")
const outbox = document.getElementById("outbox")
const submit = document.getElementById("submit")

const show = (elem) => {
    if (elem.type === "int") {
        return elem.val
    } else if (elem.type === "pair") {
        return "{" + show(elem.val.fst) + ", " + show(elem.val.snd) + "}"
    } else if (elem.type === "closure") {
        return "(needs: " + elem.val.args.join(", ") + ")"
    } else if (elem.type === "type") {
        return elem.val
    } else if (elem.type === "array") {
        return "[" + prettyprint(elem.val) + "]"
    } else if (elem.val) {
        return "(" + elem.val + ": " + elem.type + ")"
    } else {
        return elem.type
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
    let out = execRPN(scope, ast.parsed);
    if (!out) {
        outbox.innerHTML = "failed to execute";
        return;
    }
    console.log(out);
    outbox.innerHTML = prettyprint(out.stacks[0]);
}