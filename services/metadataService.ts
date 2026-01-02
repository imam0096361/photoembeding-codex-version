
import piexif from "piexifjs";

/**
 * TDS PhotoArchivePRO - Metadata Ingestion Engine
 * Developed by Imam Chowdhury
 * 
 * High-precision metadata injector optimized for Windows Explorer "Details" tab,
 * Adobe Bridge, and Enterprise Digital Asset Management (DAM) systems.
 * 
 * This version ensures 100% metadata parity between JPEG, PNG, and WebP 
 * by synchronizing EXIF, XMP, and format-specific chunks.
 */

// Windows Explorer Specific Tags (Exif IFD0)
const TAG_XP_TITLE = 0x9c9b;
const TAG_XP_COMMENT = 0x9c9c;
const TAG_XP_AUTHOR = 0x9c9d;
const TAG_XP_KEYWORDS = 0x9c9e;
const TAG_XP_SUBJECT = 0x9c9f;

// Inject Windows XP tags into piexifjs dictionary
if (piexif.TAGS && piexif.TAGS['0th']) {
  piexif.TAGS['0th'][TAG_XP_TITLE] = { name: 'XPTitle', type: 1 };
  piexif.TAGS['0th'][TAG_XP_COMMENT] = { name: 'XPComment', type: 1 };
  piexif.TAGS['0th'][TAG_XP_AUTHOR] = { name: 'XPAuthor', type: 1 };
  piexif.TAGS['0th'][TAG_XP_KEYWORDS] = { name: 'XPKeywords', type: 1 };
  piexif.TAGS['0th'][TAG_XP_SUBJECT] = { name: 'XPSubject', type: 1 };
}

export async function embedMetadata(
  base64Data: string,
  metadata: { 
    title: string; 
    caption: string; 
    keywords: string; 
    photographer: string;
    creatorTool?: string;
    createDate?: string;
    modifyDate?: string;
    rights?: string;
  },
  mimeType: string
): Promise<string> {
  const cleanMeta = {
    title: (metadata.title || "").trim().replace(/\r?\n|\r/g, " "),
    caption: (metadata.caption || "").trim().replace(/\r?\n|\r/g, " "),
    keywords: (metadata.keywords || "").trim(),
    photographer: (metadata.photographer || "").trim(),
    creatorTool: (metadata.creatorTool || "TDS PhotoArchivePRO").trim(),
    createDate: (metadata.createDate || new Date().toISOString()).trim(),
    modifyDate: (metadata.modifyDate || new Date().toISOString()).trim(),
    rights: (metadata.rights || `Copyright © ${new Date().getFullYear()} The Daily Star`).trim()
  };

  const binaryString = atob(base64Data);
  const rawBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    rawBytes[i] = binaryString.charCodeAt(i);
  }

  try {
    const xmp = createXmpPacket(cleanMeta);

    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      const cleanJpegBytes = stripMetadataSegments(rawBytes);
      const cleanBase64 = uint8ToBase64(cleanJpegBytes);
      const jpegWithExif = embedInJpeg(cleanBase64, cleanMeta);
      return insertXmpIntoJpeg(jpegWithExif, xmp);
    } else if (mimeType === 'image/png') {
      return embedInPng(rawBytes, cleanMeta, xmp);
    } else if (mimeType === 'image/webp') {
      return embedInWebP(rawBytes, cleanMeta, xmp);
    }
    
    return `data:${mimeType};base64,${base64Data}`;
  } catch (error) {
    console.error(`TDS Metadata Engine Failure:`, error);
    return `data:${mimeType};base64,${base64Data}`;
  }
}

function stripMetadataSegments(bytes: Uint8Array): Uint8Array {
  let pos = 2;
  const segments: Uint8Array[] = [bytes.slice(0, 2)];
  while (pos < bytes.length) {
    if (bytes[pos] !== 0xFF) break;
    const marker = bytes[pos + 1];
    const length = (bytes[pos + 2] << 8) | bytes[pos + 3];
    if (marker === 0xDA) {
      segments.push(bytes.slice(pos));
      break;
    }
    const isMeta = (marker === 0xE1 || marker === 0xED || marker === 0xFE || marker === 0xE2);
    if (!isMeta) {
      segments.push(bytes.slice(pos, pos + length + 2));
    }
    pos += length + 2;
  }
  const totalLength = segments.reduce((acc, s) => acc + s.length, 0);
  const result = new Uint8Array(totalLength);
  let currentOffset = 0;
  for (const s of segments) {
    result.set(s, currentOffset);
    currentOffset += s.length;
  }
  return result;
}

function toWcharByteList(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes.push(code & 0xff);       
    bytes.push((code >> 8) & 0xff); 
  }
  bytes.push(0, 0); 
  return bytes;
}

function toExifAsciiComment(str: string): string {
  const prefix = "ASCII\0\0\0";
  return prefix + str;
}

function createExifData(metadata: any): any {
  const zeroth: any = {};
  const exif: any = {};

  zeroth[piexif.ImageIFD.ImageDescription] = metadata.caption;
  zeroth[piexif.ImageIFD.Artist] = metadata.photographer;
  zeroth[piexif.ImageIFD.Software] = metadata.creatorTool;
  zeroth[piexif.ImageIFD.Copyright] = metadata.rights;

  const winKeywords = metadata.keywords.split(',').join('; ');
  zeroth[TAG_XP_TITLE] = toWcharByteList(metadata.title);
  zeroth[TAG_XP_AUTHOR] = toWcharByteList(metadata.photographer);
  zeroth[TAG_XP_KEYWORDS] = toWcharByteList(winKeywords);
  zeroth[TAG_XP_COMMENT] = toWcharByteList(metadata.caption);
  zeroth[TAG_XP_SUBJECT] = toWcharByteList(metadata.title);

  exif[piexif.ExifIFD.UserComment] = toExifAsciiComment(metadata.caption);

  return { "0th": zeroth, "Exif": exif, "GPS": {} };
}

function embedInJpeg(base64Data: string, metadata: any): string {
  const exifObj = createExifData(metadata);
  const exifBytesString = piexif.dump(exifObj);
  return piexif.insert(exifBytesString, `data:image/jpeg;base64,${base64Data}`);
}

function createXmpPacket(metadata: any): string {
  const tags = metadata.keywords.split(',').map((t: string) => `<rdf:li>${t.trim()}</rdf:li>`).join('');
  const esc = (str: string) => str.replace(/[<>&"']/g, (m) => {
    switch (m) { case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case '"': return '&quot;'; default: return '&apos;'; }
  });

  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="TDS PhotoArchivePRO Engine 2.5">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
    photoshop:Source="The Daily Star"
    photoshop:Credit="The Daily Star"
    photoshop:Headline="${esc(metadata.title)}"
    photoshop:CaptionWriter="${esc(metadata.photographer)}"
    xmp:CreatorTool="${esc(metadata.creatorTool)}"
    xmp:CreateDate="${metadata.createDate}"
    xmp:ModifyDate="${metadata.modifyDate}">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${esc(metadata.title)}</rdf:li></rdf:Alt></dc:title>
   <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${esc(metadata.caption)}</rdf:li></rdf:Alt></dc:description>
   <dc:creator><rdf:Seq><rdf:li>${esc(metadata.photographer)}</rdf:li></rdf:Seq></dc:creator>
   <dc:subject><rdf:Bag>${tags}</rdf:Bag></dc:subject>
   <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${esc(metadata.rights)}</rdf:li></rdf:Alt></dc:rights>
   <xmpRights:UsageTerms><rdf:Alt><rdf:li xml:lang="x-default">${esc(metadata.rights)}</rdf:li></rdf:Alt></xmpRights:UsageTerms>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

function insertXmpIntoJpeg(dataUrl: string, xmp: string): string {
  const base64 = dataUrl.split(',')[1];
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const header = "http://ns.adobe.com/xap/1.0/\0";
  const xmpBytes = new TextEncoder().encode(xmp);
  const headBytes = new TextEncoder().encode(header);
  const totalPayloadLen = headBytes.length + xmpBytes.length;
  const segmentLen = totalPayloadLen + 2;
  const segment = new Uint8Array(2 + segmentLen);
  segment[0] = 0xFF; segment[1] = 0xE1;
  segment[2] = (segmentLen >> 8) & 0xFF; segment[3] = segmentLen & 0xFF;
  segment.set(headBytes, 4); segment.set(xmpBytes, 4 + headBytes.length);
  let pos = 2;
  if (bytes[pos] === 0xFF && bytes[pos + 1] === 0xE0) {
    const app0Len = (bytes[pos + 2] << 8) | bytes[pos + 3];
    pos += app0Len + 2;
  }
  const result = new Uint8Array(bytes.length + segment.length);
  result.set(bytes.slice(0, pos), 0);
  result.set(segment, pos);
  result.set(bytes.slice(pos), pos + segment.length);
  return `data:image/jpeg;base64,${uint8ToBase64(result)}`;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function embedInPng(bytes: Uint8Array, metadata: any, xmp: string): string {
  // Synchronize PNG chunks with EXIF for Windows parity
  const exifObj = createExifData(metadata);
  const exifBytesString = piexif.dump(exifObj);
  const exifBytes = new Uint8Array(exifBytesString.length);
  for (let i = 0; i < exifBytesString.length; i++) exifBytes[i] = exifBytesString.charCodeAt(i);

  const chunks = [
    { key: "Title", value: metadata.title },
    { key: "Author", value: metadata.photographer },
    { key: "Description", value: metadata.caption },
    { key: "Keywords", value: metadata.keywords },
    { key: "XML:com.adobe.xmp", value: xmp }
  ];

  let offset = 8;
  const newBuffer: number[] = Array.from(bytes.slice(0, 8));
  
  // Embed EXIF chunk (eXIf) first for Windows compatibility
  newBuffer.push(...createPngChunk("eXIf", exifBytes));

  while (offset < bytes.length) {
    const length = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    
    // Insert text chunks before image data
    if (type === 'IDAT' && chunks.length > 0) {
      while (chunks.length > 0) {
        const chunk = chunks.shift()!;
        newBuffer.push(...createPngITxtChunk(chunk.key, chunk.value));
      }
    }
    
    // Skip old metadata chunks to avoid conflicts
    if (type !== 'eXIf' && type !== 'iTXt' && type !== 'tEXt') {
      newBuffer.push(...bytes.slice(offset, offset + 8 + length + 4));
    }
    
    offset += 8 + length + 4;
  }
  return `data:image/png;base64,${uint8ToBase64(new Uint8Array(newBuffer))}`;
}

function createPngChunk(type: string, data: Uint8Array): number[] {
  const typeBytes = [type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)];
  const length = [(data.length >> 24) & 0xff, (data.length >> 16) & 0xff, (data.length >> 8) & 0xff, data.length & 0xff];
  const crcData = [...typeBytes, ...Array.from(data)];
  const crc = calculateCrc(crcData);
  const crcBytes = [(crc >> 24) & 0xff, (crc >> 16) & 0xff, (crc >> 8) & 0xff, crc & 0xff];
  return [...length, ...typeBytes, ...Array.from(data), ...crcBytes];
}

function embedInWebP(bytes: Uint8Array, metadata: any, xmp: string): string {
  const exifObj = createExifData(metadata);
  const exifBytesString = piexif.dump(exifObj);
  const exifBytes = new Uint8Array(exifBytesString.length);
  for (let i = 0; i < exifBytesString.length; i++) exifBytes[i] = exifBytesString.charCodeAt(i);
  
  const xmpBytes = new TextEncoder().encode(xmp);
  const header = bytes.slice(0, 12); 
  const body = bytes.slice(12);
  
  const exifChunkType = new Uint8Array([69, 88, 73, 70]); // EXIF
  const exifChunkSize = new Uint8Array(new Uint32Array([exifBytes.length]).buffer);
  
  const xmpChunkType = new Uint8Array([88, 77, 80, 32]); // XMP 
  const xmpChunkSize = new Uint8Array(new Uint32Array([xmpBytes.length]).buffer);
  
  // Reconstruct WebP with both EXIF and XMP chunks
  const newBuffer = new Uint8Array(bytes.length + (8 + exifBytes.length) + (8 + xmpBytes.length));
  newBuffer.set(header, 0);
  
  let currentPos = 12;
  newBuffer.set(exifChunkType, currentPos); 
  newBuffer.set(exifChunkSize, currentPos + 4); 
  newBuffer.set(exifBytes, currentPos + 8);
  currentPos += 8 + exifBytes.length;
  
  newBuffer.set(xmpChunkType, currentPos); 
  newBuffer.set(xmpChunkSize, currentPos + 4); 
  newBuffer.set(xmpBytes, currentPos + 8);
  currentPos += 8 + xmpBytes.length;
  
  newBuffer.set(body, currentPos);
  newBuffer.set(new Uint8Array(new Uint32Array([newBuffer.length - 8]).buffer), 4);
  
  return `data:image/webp;base64,${uint8ToBase64(newBuffer)}`;
}

function createPngITxtChunk(keyword: string, text: string): number[] {
  const type = [105, 84, 88, 116]; // iTXt
  const data: number[] = [];
  for (let i = 0; i < keyword.length; i++) data.push(keyword.charCodeAt(i));
  data.push(0); // null terminator for keyword
  data.push(0); // compression flag (0 = uncompressed)
  data.push(0); // compression method (0)
  data.push(0); // null terminator for language tag (empty)
  data.push(0); // null terminator for translated keyword (empty)
  
  const utf8Text = unescape(encodeURIComponent(text));
  for (let i = 0; i < utf8Text.length; i++) data.push(utf8Text.charCodeAt(i));
  
  const length = [(data.length >> 24) & 0xff, (data.length >> 16) & 0xff, (data.length >> 8) & 0xff, data.length & 0xff];
  const crcData = [...type, ...data];
  const crc = calculateCrc(crcData);
  const crcBytes = [(crc >> 24) & 0xff, (crc >> 16) & 0xff, (crc >> 8) & 0xff, crc & 0xff];
  return [...length, ...type, ...data, ...crcBytes];
}

function calculateCrc(data: number[]): number {
  let crc = 0xffffffff;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (const byte of data) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
