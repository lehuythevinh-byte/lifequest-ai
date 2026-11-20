'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const d=__dirname,hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const names=fs.readdirSync(path.join(d,'ember-ink')).filter(n=>/^part-\d\d\.txt$/.test(n)).sort();
if(names.length!==26)throw Error('Expected 26 source fragments');
let game=names.map(n=>fs.readFileSync(path.join(d,'ember-ink',n),'utf8')).join('');
function verify(expected){if(hash(game)!==expected)throw Error('Game integrity mismatch: '+hash(game));}
function apply(name){const edits=JSON.parse(fs.readFileSync(path.join(d,name),'utf8'));const lines=game.split('\n');for(const e of [...edits].reverse())lines.splice(e.start-1,e.end-e.start+1,...e.lines);game=lines.join('\n');}
verify('79aa6e3c626a2c1ab5c02b7d5db2fef7a9081d5e450d91a986821bea15028ba9');
apply('atelier-portraits.patch.json');verify('6b6aa915fc7152137e78783c6aa7aee8975dc69e3b56701fae79e4e88b2a27a5');
apply('faces-of-life.patch.json');verify('f8655eeef410b5a71e9bf23169bde6c62ef1a9ce9a3f9312fb31c829f5457306');
const expected=fs.readFileSync(path.join(d,'game.sha256'),'utf8').trim().split(/\s+/)[0];verify(expected);
fs.writeFileSync(path.join(d,'game.html'),game);
console.log('V77.5 Faces of Life reconstructed:',hash(game));
