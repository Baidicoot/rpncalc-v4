/*
parse.js
--------

Parse tokenstream into AST

convert:
[
{type:"int",val:1},
{type:"int",val:2},
{type:"ident",name:"+"},
{type:"syntax",val:"("},
{type:"ident",name:"name"},
{type:"syntax",val:";"},
{type:"ident",name:"args"},
{type:"syntax",val:"->"},
{type:"int",val:2},
{type:"ident",name:"args"},
{type:"ident",name:"+"},
{type:"syntax",val:")"}
]

(for c+p)
[{type:"int",val:1},{type:"int",val:2},{type:"ident",name:"+"},{type:"syntax",val:"("},{type:"ident",name:"name"},{type:"syntax",val:";"},{type:"ident",name:"args"},{type:"syntax",val:"->"},{type:"int",val:2},{type:"ident",name:"args"},{type:"ident",name:"+"},{type:"syntax",val:")"}]

to:
[
    {type:"int", val:1},
    {type:"int", val:2},
    {type:"builtin", op:"+"},
    {type:"func", name:"name", args:["args"], body:[
        {type:"int", val:1},
        {type:"ident", val:"args"},
        {type:"builtin", op:"+"},
        }]},
]

EXPORTED FUNCTIONS:
parse - takes in tokenstream, outputs AST
*/

const builtin = [
    "+",
    "-",
    "*",
    "/",
    "typeof",
    "pair",
    "unpair"
];

/* make parser safe */
const attempt = (parser) => (stream) => {
    let streamclone = [...stream];
    try {
        let out = parser(stream);
        return out;
    } catch(err) {
        console.log(err);
        return {parsed:null,stream:streamclone};
    }
}

/* chain */
const or = (a, b) => (stream) => {
    let aout = a(stream);
    if (aout.parsed === null) {
        return b(stream);
    } else {
        return aout;
    }
}

/* (parser) */
const parens = (parser) => (stream) => {
    let a = parseSyntax("(", stream);
    if (a === null) {
        return {parsed:null, stream:stream};
    }
    let dat = parser(stream);
    a = parseSyntax(")", stream);
    if (a === null) {
        throw 'mismatched parens!';
    }
    return dat;
}

/* [parser] */
const many = (parser) => (stream) => {
    let parsed = [];
    for (let i = parser(stream); i.parsed !== null; i = parser(stream)) {
        parsed.push(i.parsed);
    }
    return {parsed:parsed, stream:stream};
}

/* takes in stream, outputs {parsed, stream} */
const parseBuiltin = (stream) => {
    let e = stream[0];
    if (e === undefined) {
        return {parsed:null, stream:stream};
    }
    if (e.type !== "ident") {
        return {parsed:null, stream:stream};
    }
    if (builtin.includes(e.name)) {
        stream.shift();
        return {parsed:{type:"builtin", val:e.name}, stream:stream};
    } else {
        return {parsed:null, stream:stream};
    }
}

/* takes in stream, outputs parsed item or null */
const parseIdent = (stream) => {
    let e = stream[0];
    if (e === undefined) {
        return {parsed:null, stream:stream};
    }
    if (e.type !== "ident") {
        return {parsed:null, stream:stream};
    } else {
        stream.shift();
        return {parsed:{type:e.type, val:e.name}, stream:stream};
    }
}

/* takes in stream, outputs parsed item or null */
const parseInteger = (stream) => {
    let e = stream[0];
    if (e === undefined) {
        return {parsed:null, stream:stream};
    }
    if (e.type !== "int") {
        return {parsed:null, stream:stream};
    } else {
        stream.shift();
        return {parsed:{type:e.type, val:e.val}, stream:stream};
    }
}

/* takes in stream, outputs parsed item or null */
const parseSyntax = (syntax, stream) => {
    let e = stream[0];
    if (e === undefined) {
        return {parsed:null, stream:stream};
    }
    if (e.type !== "syntax") {
        return {parsed:null, stream:stream};
    }
    if (e.val !== syntax) {
        return {parsed:null, stream:stream};
    } else {
        stream.shift();
        return {parsed:{type:"syntax", val:syntax}, stream:stream};
    }
}

/* takes in stream, outputs string or null - FAILABLE */
const parseName = (stream) => {
    let id = parseIdent(stream);
    if (id.parsed === null) {
        return {parsed:null, stream:stream};
    }
    let syn = parseSyntax(";", stream);
    if (syn.parsed === null) {
        throw 'could not parse name!'
    }
    return {parsed:id.parsed.val, stream:stream};
}

/* takes in stream, outputs parsed item or null - FAILABLE */
const parseLambda = (stream) => {
    let name = attempt(parseName)(stream).parsed;
    if (name === null) {
        name = "";
    }
    let args = many(parseIdent)(stream).parsed;
    if (parseSyntax("->", stream).parsed === null) {
        throw 'no lambda body found!';
    }
    let body = parseExprs(stream).parsed; // .parsed should never be null, but anyway...
    if (body === null) {
        throw 'no lambda body found!';
    }
    return {parsed:{type:"func", name:name, args:args, body:body}, stream:stream};
}

/* takes in stream, outputs parsed item or null */
const parseExpr = or(parseBuiltin, or(parseIdent, or(parseInteger, attempt(parens(parseLambda)))));

/* takes in stream, outputs parsed items */
export const parseExprs = many(parseExpr);