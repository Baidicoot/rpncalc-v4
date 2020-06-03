import {assertType, addDefn} from './builtin.mjs';
import {execFn} from './shiny.mjs';

const getElem = (args) => [{type:"domNode", val:document.getElementById(args[0])}];
const setHTML = (args) => args[0].innerHTML = args[1];
const mutref = (args) => [{type:"&mut", val:args[0]}];
const readmut = (args) => [args[0]];

const log = (args) => {
    console.log(args);
    return [];
}

const writemut = (args) => {
    assertType("&mut", args[1]);
    args[1].val = args[0];
    return [];
}

const onclick = (args) => {
    args[0].onclick = (_) => {
        execFn(args[1]);
    }
    return [];
}

addDefn("log", 1, log);
addDefn("getId", ["string"], getElem);
addDefn("setHTML", ["domNode", "string"], setHTML);
addDefn("mutref", 1, mutref);
addDefn("readmut", ["&mut"], readmut);
addDefn("writemut", 2, writemut);
addDefn("onclick", ["domNode", "closure"], onclick);