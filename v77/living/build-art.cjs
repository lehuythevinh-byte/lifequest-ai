// Generates the small, original pixel backdrops, nine-slice trim and glyphs used by the dialogue UI.
// No font, game texture or third-party image is required.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const out = path.join(__dirname, 'art');
fs.mkdirSync(out, { recursive: true });

function crc32(data) {
  let n = -1;
  for (const byte of data) {
    n ^= byte;
    for (let bit = 0; bit < 8; bit++) n = (n >>> 1) ^ ((n & 1) ? 0xedb88320 : 0);
  }
  return (n ^ -1) >>> 0;
}
function chunk(name, data) {
  const tag = Buffer.from(name);
  const size = Buffer.alloc(4), checksum = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([size, tag, data, checksum]);
}
function image(width, height) {
  const pixels = Buffer.alloc(width * height * 4);
  const colors = new Map();
  const rgb = (color) => {
    if (!colors.has(color)) colors.set(color, parseInt(color.replace('#', ''), 16));
    return colors.get(color);
  };
  const dot = (x, y, color) => {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = 4 * (x + y * width), c = rgb(color);
    pixels[i] = c >> 16; pixels[i + 1] = c >> 8; pixels[i + 2] = c; pixels[i + 3] = 255;
  };
  const box = (x,y,w,h,c) => {
    for (let j=Math.max(0,Math.floor(y)); j<Math.min(height,y+h); j++)
      for (let i=Math.max(0,Math.floor(x)); i<Math.min(width,x+w); i++) dot(i,j,c);
  };
  const line = (x,y,a,b,c) => {
    const n = Math.max(Math.abs(a-x),Math.abs(b-y),1);
    for (let i=0;i<=n;i++) dot(Math.round(x+(a-x)*i/n), Math.round(y+(b-y)*i/n),c);
  };
  const poly = (points,c) => {
    const ys = points.map(p => p[1]);
    for (let y=Math.max(0,Math.min(...ys));y<Math.min(height,Math.max(...ys));y++) {
      const hits=[];
      points.forEach(([x1,y1],i)=>{
        const [x2,y2]=points[(i+1)%points.length];
        if ((y1<=y+.5 && y2>y+.5)||(y2<=y+.5 && y1>y+.5)) hits.push(x1+(x2-x1)*(y+.5-y1)/(y2-y1));
      });
      hits.sort((a,b)=>a-b);
      for(let i=0;i+1<hits.length;i+=2) box(Math.ceil(hits[i]),y,Math.ceil(hits[i+1])-Math.ceil(hits[i]),1,c);
    }
  };
  const oval = (x,y,rx,ry,c) => {
    for(let j=-ry;j<=ry;j++) {
      const span=Math.round(rx*Math.sqrt(Math.max(0,1-(j*j)/(ry*ry))));
      box(x-span,y+j,2*span+1,1,c);
    }
  };
  const save = (file) => {
    const ihdr=Buffer.alloc(13);
    ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
    const row=width*4, raw=Buffer.alloc(height*(row+1));
    for(let y=0;y<height;y++) pixels.copy(raw,y*(row+1)+1,y*row,(y+1)*row);
    fs.writeFileSync(path.join(out,file+'.png'),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]));
  };
  return { width,height,dot,box,line,poly,oval,save };
}
function random(seed) {
  return (limit) => { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return Math.floor(seed/4294967296*limit); };
}
const regions = {
  town:    ['8bb6af','c2d2ae','f4d59b','a1b78c','7eaa88','5f8a72','344f48','d6ac6f','e8c77c','8c805b'],
  art:     ['877f9c','c7a3aa','edbd9c','ab92a9','817e96','637a87','383f58','dd967e','efc577','886e82'],
  tech:    ['637d94','92adba','b5c9c2','83a1ab','6a8b9d','4c6d82','304757','b8ae8f','bce1cf','6d8b98'],
  oriaris: ['ac8690','d0a393','f5cf9a','ae998d','838b82','647a6e','414b4e','cb9d70','e6c888','887969'],
  wish:    ['80a7a7','afc8ac','cee0b1','86afa0','65948b','497d76','2f5153','9cae83','dfdf9e','6a947c'],
  vocalt:  ['9e7480','c48c88','efbf94','ad8c89','8c787e','766976','4e444f','bf8873','f4ca82','967868'],
  mine:    ['282c41','343d4e','4d5563','46535d','394957','34434c','262d38','a87960','eac777','5d5d64']
};
const forest = ['314d49','46685c','5e8166','74946c','95ac78','abb782'];
function drawScene(region,index) {
  const s=image(184,128), {box,line,poly,oval,dot}=s;
  const [sky,haze,horizon,far,mid,land,ink,ochre,gold,ground]=regions[region];
  const rng=random(509+index*211), W=s.width,H=s.height;
  // Dither a small number of pixels across each sky band to keep the palette legible at 2x.
  box(0,0,W,H,sky);box(0,26,W,29,haze);box(0,55,W,34,horizon);
  for(const [y,c] of [[26,sky],[55,haze]]) for(let n=0;n<170;n++) dot(rng(W),y+rng(3),c);
  if(region!=='mine') {
    oval(128,27,12,12,horizon);oval(128,27,8,8,gold);
    for(let i=0;i<7;i++){
      const x=rng(W),y=7+rng(36),w=7+rng(16);
      box(x,y,w,2,haze);box(x+3,y-2,w-7,2,haze);box(x-4,y+2,w+10,1,haze);
    }
  }
  function ridge(y,amplitude,step,color) {
    const pts=[[-4,H],[-4,y]];
    for(let x=0;x<W+step;x+=step) pts.push([x,y-rng(amplitude)]);
    pts.push([W+step,H]); poly(pts,color);
  }
  ridge(70,25,12,far);ridge(81,22,8,mid);ridge(87,12,10,land);
  function tree(x,y,scale,pal=forest) {
    const u=(a)=>Math.round(a*scale);
    const E=(a,b,rx,ry,c)=>oval(x+u(a),y+u(b),Math.max(1,u(rx)),Math.max(1,u(ry)),c);
    box(x-u(2),y-u(3),u(4),u(25),pal[0]);line(x,y+u(15),x+u(8),y+u(2),pal[0]);
    for(const [a,b,rx,ry] of [[-10,-3,12,8],[-11,-11,9,8],[1,-13,13,11],[11,-7,11,10],[2,2,14,9],[-13,2,8,5]]) E(a,b,rx,ry,pal[1]);
    for(const [a,b,rx,ry] of [[-11,-9,9,6],[0,-16,10,7],[8,-10,7,6],[-8,-3,8,5],[3,-6,7,6],[11,-3,5,4]]) E(a,b,rx,ry,pal[2]);
    for(const [a,b,rx,ry] of [[-12,-11,6,3],[-3,-18,7,4],[3,-14,5,3],[-6,-6,4,3]]) E(a,b,rx,ry,pal[3]);
    for(let j=0;j<18;j++){ const a=-12+rng(22),b=-17+rng(12);box(x+u(a),y+u(b),Math.max(1,u(2)),1,pal[3+rng(2)]); }
  }
  function pine(x,y,h,c) {
    box(x-1,y-h,2,h,c);
    for(let i=1;i<5;i++) poly([[x,y-h+Math.round((i-1)*h/6)],[x+i*2,y-h+Math.round((i+1)*h/6)],[x-i*2,y-h+Math.round((i+1)*h/6)]],c);
  }
  function pane(x,y,w,h,lit,frame=ink){
    box(x,y,w,h,frame);box(x+1,y+1,w-2,h-2,lit);
    if(w>=6)box(x+Math.floor(w/2),y+1,1,h-2,frame);
    if(h>=9)box(x+1,y+4,w-2,1,frame);
  }
  function house(x,y,w,h,roof,wall,variant=0) {
    const roofH=Math.round(w*.36);
    box(x,y,w,h,ink);box(x+1,y+2,w-2,h-2,wall);
    box(x+w-9,y-roofH,4,Math.max(4,roofH-1),ink);box(x+w-9,y-roofH+1,3,5,ochre);
    poly([[x-3,y+2],[x+Math.floor(w*.29),y-roofH],[x+w-5,y-roofH+1],[x+w+3,y+2]],ink);
    poly([[x-1,y],[x+Math.floor(w*.29),y-roofH+1],[x+w-6,y-roofH+2],[x+w,y]],roof);
    for(let i=0;i<5;i++) box(x+3+rng(Math.max(1,w-8)),y-3-rng(Math.max(1,roofH-5)),2,1,ochre);
    box(x,y+2,w,2,ochre);box(x+2,y+4,1,h-4,ink);box(x+w-4,y+4,1,h-4,ink);
    pane(x+5,y+6,5,7,gold);pane(x+w-10,y+6,5,7,gold);
    box(x+Math.floor(w/2)-2,y+h-8,5,8,ink);
    if(variant) { box(x-1,y+10,w+2,3,ink); for(let i=0;i<w;i+=5)box(x+i,y+10,4,4,(i%2)?gold:roof); }
  }
  function tower(x,y,w,h,royal) {
    const wall=royal?'cda881':'baa09e',roof=royal?'914f5c':'626776';
    box(x,y,w,h,ink);box(x+1,y+1,w-2,h-1,wall);box(x+w-4,y+1,3,h-1,ground);
    if(royal){poly([[x-3,y],[x+Math.floor(w/2),y-13],[x+w+3,y]],ink);poly([[x-1,y-1],[x+Math.floor(w/2),y-11],[x+w+1,y-1]],roof);}
    else {box(x-1,y-2,w+2,3,ink);for(let i=0;i<w;i+=4)box(x+i,y-5,2,4,ink);}
    box(x+Math.floor(w/2)-1,y+5,3,6,ink);dot(x+Math.floor(w/2),y+6,gold);
  }
  function lamp(x,y) {
    box(x,y,2,19,ink);box(x-3,y-7,8,7,ink);box(x-2,y-6,6,4,gold);
    box(x-4,y-8,10,1,ink);box(x-2,y-10,6,2,ink);box(x,y-12,2,2,ink);
  }
  function foreground(c1,c2){
    poly([[0,102],[20,99],[40,101],[62,110],[84,121],[104,128],[0,128]],c1);
    poly([[120,128],[142,111],[162,105],[184,107],[184,128]],c2);
    for(let i=0;i<105;i++){
      const x=rng(184), y=109+rng(19);
      if((x<43||x>149)&&y>112){line(x,y,x+1,y-2,land);if(i%11===0)dot(x,y-2,gold);}
    }
  }
  if(region==='town') {
    box(0,83,W,45,ground); poly([[97,82],[106,82],[91,98],[119,128],[69,128],[81,100]],'c0ac80');
    for(const [x,y,w,h] of [[16,72,21,15],[40,68,28,19],[104,68,22,17],[134,65,29,23]]) house(x,y,w,h,'9f6958','d8c593');
    house(153,73,38,26,'956650','d7bd87',1);tree(20,56,.89);tree(0,43,1.3);tree(179,49,.76);
    for(let x=24;x<=72;x+=8){box(x,85,2,11,'726c50');box(x-1,88,10,2,'ab936b');}
    lamp(143,81); foreground('698566','536f5d');
  } else if(region==='art') {
    box(0,85,W,43,'ac8a87');
    for(const [x,y,w,h,c] of [[-9,51,42,44,'b48d85'],[28,60,32,32,'c09a91'],[123,52,29,40,'a28b92'],[148,42,41,54,'d3a18c']]) {
      box(x,y,w,h,ink);box(x+2,y+2,w-4,h-3,c);box(x-2,y-2,w+4,3,'57556c');
      for(let xx=x+5;xx<x+w-4;xx+=10) { pane(xx,y+6,6,8,'d4bc9e');box(xx-1,y+14,8,2,'735e72'); }
      box(x,y+h-16,w,2,ink);for(let j=0;j<w;j+=5)box(x+j,y+h-13,5,4,j%2?'dcb371':'a66380');
    }
    line(0,37,90,50,ink);line(90,50,183,33,ink);
    for(let i=0;i<13;i++){let x=7+i*14,y=x<90?38+Math.floor(x*.14):50-Math.floor((x-90)*.18);poly([[x,y],[x+6,y+1],[x+2,y+7]],['e5ae71','9e6683','6d999c'][i%3]);}
    line(22,96,15,111,ink);line(22,96,28,111,ink);box(13,86,18,14,ochre);box(15,88,14,10,'e5caa5');poly([[16,97],[21,91],[23,95],[27,92],[28,97]],'948da0');
    foreground('7e7980','6a7180');
  } else if(region==='tech') {
    box(0,86,W,42,'718998');
    for(let i=0;i<20;i++){
      const x=i*10-2,y=37+rng(25),h=48+rng(6)-y+43,w=9+rng(7);
      box(x,y,w,h,mid);box(x+1,y+1,w-3,h-1,'7893a0');
      for(let k=y+5;k<79;k+=6)box(x+2,k,w-4,2,'a2bab9');
    }
    for(const [x,y,w] of [[-6,39,38],[20,55,24],[150,42,34]]){
      box(x,y,w,94-y,ink);box(x+2,y+3,w-5,88-y,'627e8e');box(x-2,y-2,w+4,3,'a6b8b3');
      for(let k=y+7;k<89;k+=8){box(x+3,k,w-7,5,'446475');for(let a=x+4;a<x+w-5;a+=6)box(a,k,4,3,'8fb7bc');}
    }
    poly([[0,103],[184,90],[184,98],[0,114]],'8fa7aa');line(0,103,183,90,'b0bfad');
    for(const x of [44,137]){box(x,68,2,28,ink);box(x-2,67,9,2,'abd4cf');}
    foreground('556c77','496471');
  } else if(region==='oriaris'||region==='vocalt') {
    const royal=region==='vocalt';
    box(0,85,W,43,ground);
    box(17,69,55,21,'9c8c85');box(117,66,57,25,royal?'bd9184':'ae968b');
    for(let i=0;i<58;i+=6){box(16+i,65,4,5,ink);box(117+i,63,4,4,ink);}
    tower(12,53,14,36,royal);tower(52,46,13,43,royal);tower(121,47,12,42,royal);tower(159,37,17,54,royal);
    for(const [x,y] of [[17,51],[57,44],[125,46],[166,36]]){line(x,y-2,x,y-22,ink);poly([[x+1,y-21],[x+10,y-20],[x+5,y-16],[x+1,y-16]],royal?'9f5267':'81707c');}
    if(royal){house(-4,79,48,20,'995664','d1aa88',1);house(146,76,46,25,'a36269','d6b686',1);lamp(131,79);}
    else {pine(4,98,37,ink);pine(36,93,27,land);pine(178,96,38,land);}
    poly([[87,85],[101,85],[129,128],[57,128]],'c0a287');
    for(let i=0;i<49;i++){let x=68+rng(49),y=98+rng(28);if(x<90+(y-84)*.7&&x>90-(y-84)*.7)box(x,y,2+rng(4),1,ground);}
    foreground(royal?'966e70':'79826e',royal?'785d6b':'5e7367');
  } else if(region==='wish') {
    for(let x=-5;x<W+5;x+=6+rng(7)) pine(x,80+rng(8),14+rng(27),land);
    poly([[107,61],[121,44],[142,40],[171,48],[184,34],[184,99],[103,97]],'49726d');
    poly([[128,48],[143,43],[157,49],[147,71],[151,86],[135,89],[130,73]],'86b8ac');
    for(let i=0;i<9;i++){let x=131+i*2,y=49+rng(14);line(x,y,x-2,y+10+rng(9),i%2?'b5d2b8':'74a9a1');}
    poly([[126,85],[155,84],[172,92],[128,104],[145,120],[184,125],[184,128],[103,128],[107,107],[142,92]],'7ca89c');
    for(let i=0;i<30;i++)box(122+rng(37),87+rng(8),3+rng(6),1,'b8d2b4');
    tree(24,55,1.35,['304e4f','3f6861','52816e','689876','85ab82']);tree(-3,41,1.55);tree(179,63,.81);
    foreground('698d71','3a6660');
  } else {
    box(0,0,W,H,'25303d');
    for(let k=0;k<4;k++){
      const margin=k*13,x=10+margin,y=3+k*8,w=163-margin*2,h=99-k*7;
      poly([[x,y+h],[x+3,y+18],[x+19,y+5],[x+37,y],[x+w-22,y+2],[x+w-1,y+22],[x+w,y+h]],['43505b','364652','2e3b48','27333e'][k]);
    }
    for(let x=0;x<184;x+=13){const h=7+rng(19);poly([[x,0],[x+10,0],[x+5,h]],ink);}
    for(const x of [14,158]){box(x,28,8,80,'4f433f');box(x+1,30,2,72,'7d614e');line(x+1,53,x+22,27,'806347');}
    box(9,24,162,8,'5d4d45');box(10,25,159,2,'87694c');lamp(150,51);
    for(const [x,y,h] of [[6,101,17],[14,106,25],[21,108,13],[153,111,17],[174,107,23]]) {
      poly([[x-4,y],[x-5,y-h+5],[x-2,y-h],[x+2,y-h+3],[x+4,y-3]],'6e91a6');poly([[x-2,y-h],[x+1,y-h+4],[x+1,y-2],[x-2,y-3]],'a2c3c1');
    }
    poly([[59,128],[89,85],[95,85],[78,128]],'645647');poly([[118,128],[104,85],[108,85],[136,128]],'645647');
    for(const y of [91,97,105,116,126]){const spread=Math.floor((y-86)*.68);line(88-spread,y,106+spread*.7,y,'837266');}
    foreground('414b51','35434b');
  }
  s.save('scene-'+region);
}

const metals={town:['594b33','a5884f','d7bb79','f4dba0'],art:['52435a','987581','ccaa8d','f5ce9b'],tech:['344d5b','65878b','a3b7a3','d0dbc7'],oriaris:['61494b','9b7963','d1ad77','f5dca2'],wish:['3b5751','78907a','b3bd88','e0db9c'],vocalt:['63464a','a27a4d','d0a65e','f6cf84'],mine:['454348','796757','af8c64','dbc094']};
function trim(region) {
  const s=image(32,32), [a,b,c,d]=metals[region];
  for(const side of [0,1,2,3]){
    const p=(x,y,color)=>{
      const points=[[x,y],[31-y,x],[31-x,31-y],[y,31-x]];s.dot(...points[side],color);
    };
    for(let x=1;x<31;x++){p(x,0,a);p(x,1,c);p(x,2,b);p(x,3,a);p(x,5,b);}
    for(let x=0;x<7;x++)for(let y=0;y<7;y++)if(x+y<7)p(x,y,a);
    [[0,3],[1,2],[2,1],[3,0],[1,4],[2,3],[3,2],[4,1],[2,5],[3,4],[4,3],[5,2],[5,5],[6,4],[4,6],[7,4],[4,7]].forEach(([x,y])=>p(x,y,c));
    [[2,2],[3,3],[4,4],[7,5],[5,7]].forEach(([x,y])=>p(x,y,d));
  }
  s.save('trim-'+region);
}
Object.keys(regions).forEach((region,index)=>{drawScene(region,index);trim(region);});

// Monochrome raster masks share the current text color of their controls.
const icons={
  dialogue:['.............','..########...','.##......##..','.##.####.##..','.##......##..','.##.##...##..','.##......##..','..###.####...','....###......','....##.......'],
  language:['......#......','.####.#.####.','.##..###..##.','.##...#...##.','.##...#...##.','.##...#...##.','.##...#...##.','.######.####.','.....###.....'],
  memory:['..########...','..##....##...','..##.##.##...','..##....##...','..##.##.##...','..##....##...','..##....##...','..###..###...','..##.##.##...','..#......#...'],
  settings:['...##..##....','...######....','.###....###..','..##.##.##...','..##.##.##...','.###....###..','...######....','...##..##....'],
  mic:['.....###.....','....#####....','....#####....','....#####....','..#.#####.#..','..##.###.##..','...##...##...','....#####....','......#......','....#####....'],
  send:['..##.........','..####.......','..######.....','...#######...','.....#######.','...#######...','..######.....','..####.......','..##.........'],
  close:['..##.....##..','...##...##...','....##.##....','.....###.....','......#......','.....###.....','....##.##....','...##...##...','..##.....##..'],
  pin:['....#####....','...##...##...','..##.....##..','..##..#..##..','...##...##...','....#####....','.....###.....','......#......'],
  feather:['........###..','......#####..','.....#####...','....##..##...','...######....','...##.##.....','...####......','...##........','..##.........'],
  lantern:['.....###.....','....##.##....','...#######...','..#########..','...##...##...','...##.#.##...','...##.#.##...','....#####....','...#######...']
};
for(const [name,rows] of Object.entries(icons)){
  const s=image(13,13);
  rows.forEach((row,y)=>[...row].forEach((p,x)=>{if(p==='#')s.dot(x,y+Math.floor((13-rows.length)/2),'ffffff');}));
  s.save('icon-'+name);
}
