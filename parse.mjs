/*
parse.js
--------

Parse tokenstream into AST

convert:
[
{type:"int",val:1},
{type:"int",val:2},
{type:"ident",name:"+"},
{type:"syntax",val:"'"},
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
[{type:"int",val:1},{type:"int",val:2},{type:"ident",name:"+"},{type:"syntax",val:"'"},{type:"syntax",val:"("},{type:"ident",name:"name"},{type:"ident",name:"args"},{type:"syntax",val:"->"},{type:"int",val:2},{type:"ident",name:"args"},{type:"ident",name:"+"},{type:"syntax",val:")"}]

to:
[
    {type:"int", val:1},
    {type:"int", val:2},
    {type:"builtin", op:"+"},
    {type:"push", elem:
            {type:"func", args:["args"], body:[
            {type:"int", val:1},
            {type:"ident", val:"args"},
            {type:"builtin", op:"+"},
    }}]}}
]

EXPORTED FUNCTIONS:
parseExprs - takes in tokenstream, outputs AST
*/

/* make parser safe */
const attempt = (parser) => (stream) => {
    let streamclone = [...stream];
    try {
        let out = parser(stream);
        return out;
    } catch(err) {
        return {parsed:null,stream:streamclone};
    }
}

/* chain */
const or = (a, b) => (stream) => {
    let aout = a(stream);
    if (aout.parsed === null) {
        return b(aout.stream);
    } else {
        return aout;
    }
}

/* (parser) */
const parens = (parser) => (stream) => {
    let a = parseSyntax("(")(stream);
    if (a.parsed === null) {
        return {parsed:null, stream:a.stream};
    }
    let dat = parser(a.stream);
    a = parseSyntax(")")(dat.stream);
    if (a.parsed === null) {
        throw 'mismatched parens!';
    }
    return {parsed:dat.parsed, stream:a.stream};
}

/* [parser] */
const many = (parser) => (stream) => {
    let parsed = [];
    for (let i = parser(stream); i.parsed !== null; i = parser(stream)) {
        parsed.push(i.parsed);
        stream = i.stream;
    }
    return {parsed:parsed, stream:stream};
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
const parseSyntax = (syntax) => (stream) => {
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
        return {parsed:null, stream:id.stream};
    }
    let syn = parseSyntax(";")(id.stream);
    if (syn.parsed === null) {
        throw 'could not parse name!'
    }
    return {parsed:id.parsed.val, stream:syn.stream};
}

const parseType = (stream) => {
    
    let syn = attempt(parseSyntax("\""))(stream);
    if (syn.parsed === null) {
        return {parsed:null, stream:syn.stream};
    }
    let id = parseIdent(syn.stream);
    if (id.parsed === null) {
        return {parsed:null, stream:id.stream};
    }
    return {parsed:{type:"type", val:id.parsed.val}, stream:id.stream};
    
    //return {parsed:null, stream:stream};
}

/* takes in stream, outputs parsed item or null - FAILABLE */
const parsePush = (stream) => {
    let syn = attempt(parseSyntax("'"))(stream);
    if (syn.parsed === null) {
        return {parsed:null, stream:syn.stream};
    }
    let id = parseExpr(syn.stream);
    if (id.parsed === null) {
        return {parsed:null, stream:id.stream};
    }
    return {parsed:{type:"push", elem:id.parsed}, stream:id.stream};
}

const parseDefn = (stream) => {
    let name = parseName(stream);
    if (name.parsed === null) {
        throw 'no name found!'
    }
    let expr = parseExprs(stream);
    if (expr.parsed === null) {
        throw 'no body found!'
    }
    return {parsed:{type:"defn", ident:name.parsed, defn:expr.parsed}, stream:expr.stream}
}

/* takes in stream, outputs parsed item or null - FAILABLE */
const parseLambda = (stream) => {
    let args = many(parseIdent)(stream);
    let syn = parseSyntax("->")(args.stream);
    if (syn.parsed === null) {
        throw 'no lambda body found!';
    }
    let body = parseExprs(syn.stream); // .parsed should never be null, but anyway...
    if (body.parsed === null) {
        throw 'no lambda body found!';
    }
    return {parsed:{type:"func", args:args.parsed.map(x => x.val), body:body.parsed}, stream:body.stream};
}

/* takes in stream, outputs parsed item or null */
const parseExpr = or(
    attempt(parens(parseDefn)), or(
    attempt(parens(parseLambda)), or(
    attempt(parseLambda), or(
    parseType, or(
    parseIdent, or(
    parseInteger,
    parsePush
    ))))));

/* takes in stream, outputs parsed items */
export const parseExprs = many(parseExpr);