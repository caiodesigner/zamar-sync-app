// Inspect raster dimensions before decoding; SVG and remote resources are not accepted.
export function imageDimensions(bytes:Buffer):{width:number;height:number} {
 let width=0,height=0;
 if(bytes.length>=24 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16)==='IHDR') {width=bytes.readUInt32BE(16);height=bytes.readUInt32BE(20);}
 else if(bytes[0]===0xff && bytes[1]===0xd8) {
  let offset=2;
  while(offset+4<=bytes.length) {
   if(bytes[offset++]!==0xff)break;
   while(bytes[offset]===0xff)offset++;
   const marker=bytes[offset++];if(marker===0xda || marker===0xd9)break;
   if(marker===0x01 || (marker>=0xd0 && marker<=0xd7))continue;
   if(offset+2>bytes.length)break;
   const length=bytes.readUInt16BE(offset);if(length<2 || offset+length>bytes.length)break;
   if([0xc0,0xc1,0xc2].includes(marker) && length>=8) {height=bytes.readUInt16BE(offset+3);width=bytes.readUInt16BE(offset+5);break;}
   offset+=length;
  }
 }
 if(!width || !height || width>8192 || height>8192 || width*height>32000000)throw new Error('Selecione PNG ou JPEG válido, com até 8192 pixels por lado e 32 megapixels.');
 return {width,height};
}
