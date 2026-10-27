/* Item Repair Hub v2.3.1: deterministic, uncompressed ZIP writer. */
(function(root){'use strict';
  const enc=new TextEncoder();
  const table=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  function crc(bytes){let n=0xffffffff;for(const b of bytes)n=table[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
  function pack(files){
    const locals=[],central=[];let offset=0,count=0,total=0;
    for(const [name,value] of [...files].sort(([a],[b])=>a.localeCompare(b))){
      if(!/^item-repair-hub\//.test(name)||name.includes('\\')||name.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Invalid archive path.');
      const filename=enc.encode(name),bytes=typeof value==='string'?enc.encode(value):new Uint8Array(value);
      total+=bytes.length;if(total>64*1024*1024||filename.length>65535||++count>2000)throw Error('The repair package exceeds the export limit.');
      const sum=crc(bytes),local=new Uint8Array(30+filename.length),lv=new DataView(local.buffer);
      lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);lv.setUint16(12,33,true);
      lv.setUint32(14,sum,true);lv.setUint32(18,bytes.length,true);lv.setUint32(22,bytes.length,true);lv.setUint16(26,filename.length,true);local.set(filename,30);
      const record=new Uint8Array(46+filename.length),cv=new DataView(record.buffer);
      cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,33,true);
      cv.setUint32(16,sum,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,filename.length,true);cv.setUint32(42,offset,true);record.set(filename,46);
      locals.push(local,bytes);central.push(record);offset+=local.length+bytes.length;
    }
    const size=central.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);
    ev.setUint32(0,0x06054b50,true);ev.setUint16(8,count,true);ev.setUint16(10,count,true);ev.setUint32(12,size,true);ev.setUint32(16,offset,true);
    const out=new Uint8Array(offset+size+22);let at=0;for(const part of [...locals,...central,end]){out.set(part,at);at+=part.length;}return out;
  }
  const api={pack,crc};if(typeof module!=='undefined')module.exports=api;else root.HubZip=api;
})(globalThis);
