const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../assets/core.js'),base=require('../data/products.json')[0];
test('La mezcla conserva todos los arreglos sin modificar la fuente',()=>{
 const products=Array.from({length:5},(_,i)=>({...base,id:String(i)})),before=products.map(p=>p.id),mixed=core.shuffleProducts(products,()=>0);
 assert.deepEqual(products.map(p=>p.id),before);assert.deepEqual([...mixed.map(p=>p.id)].sort(),[...before].sort());assert.notDeepEqual(mixed.map(p=>p.id),before);
});
test('El orden aleatorio es estable al filtrar, y ordenar por precio no lo modifica',()=>{
 const products=[{...base,id:'a',name:'Zeta',price:900},{...base,id:'b',name:'Alfa',price:300},{...base,id:'c',name:'Medio',price:600},{...base,id:'q',name:'Cotizar',price:null,priceType:'quote'}];
 assert.deepEqual(core.filterProducts(products,{sort:'random'}).map(p=>p.id),['a','b','c','q']);
 assert.deepEqual(core.filterProducts(products,{sort:'random',budget:650}).map(p=>p.id),['b','c']);
 assert.deepEqual(core.filterProducts(products,{sort:'price-low'}).map(p=>p.id),['b','c','a','q']);
 assert.deepEqual(core.filterProducts(products,{sort:'price-high'}).map(p=>p.id),['a','c','b','q']);
 assert.deepEqual(core.filterProducts(products,{sort:'random'}).map(p=>p.id),['a','b','c','q']);
});
