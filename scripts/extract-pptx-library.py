#!/usr/bin/env python3
"""Extract the supplied Encontro deck without network access or third-party packages."""
import argparse
import hashlib
import json
import posixpath
import re
import unicodedata
import uuid
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
P = '{http://schemas.openxmlformats.org/presentationml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
# Explicit editorial splits where the deck changes songs without a title.
# The lyric is retained, and each such title is marked as inferred for review.
INFERRED = {46:'Vitória, vitória',114:'Satisfação',118:'Meu coração transborda de amor',
 122:'A tua graça é melhor que a vida',125:'Eu só confio no Senhor',
 129:'A alegria está no coração',168:'Ó Deus, tu és o meu Deus forte',
 382:'Deus forte',383:'A luta vem e passa',384:'Caminhando vou',863:'Fico tão impressionado'}

def fold(s):
    return re.sub(r'\s+', ' ', ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if not unicodedata.combining(c))).strip()

def read_slides(path):
    slides=[]
    with ZipFile(path) as z:
        rels={r.attrib['Id']:r.attrib['Target'] for r in ET.fromstring(z.read('ppt/_rels/presentation.xml.rels'))}
        presentation=ET.fromstring(z.read('ppt/presentation.xml'))
        for position,sid in enumerate(presentation.findall('.//'+P+'sldId'),1):
            target=rels[sid.attrib[R+'id']]
            name=posixpath.normpath(posixpath.join('ppt',target)) if not target.startswith('/') else target.lstrip('/')
            root=ET.fromstring(z.read(name));lines=[];first_size=None
            for para in root.iter(A+'p'):
                text=''
                for node in para:
                    if node.tag==A+'br':text+='\n'
                    elif node.tag in (A+'r',A+'fld'):
                        value=''.join(t.text or '' for t in node.iter(A+'t'))
                        if value.strip() and first_size is None:
                            props=node.find(A+'rPr');first_size=int(props.get('sz','0')) if props is not None else 0
                        text+=value
                lines.extend(re.sub(r'[ \t\xa0]+',' ',line).strip() for line in text.splitlines() if line.strip())
            slides.append({'slide':position,'part':name,'lines':lines,'firstRunFontSize':first_size})
    return slides

def extract(path):
    slides=read_slides(path);songs=[];excluded=[];current=None
    def start(title,slide,method,number=None):
        nonlocal current
        current={'id':'enc-'+uuid.uuid5(uuid.NAMESPACE_URL,'zamar:encontro:slide:'+str(slide)).hex,
          'title':title,'author':'','archived':False,'sections':[],'sequence':[],
          'source':{'firstSlide':slide,'slides':[],'titleMethod':method,'originalNumber':number},
          'review':{'status':'pending','issues':[]}}
        if method=='inferred-first-line':current['review']['issues'].append('Título e divisão inferidos da letra: confirmar no PowerPoint.')
        songs.append(current)
    for slide in slides:
        n=slide['slide'];lines=list(slide['lines'])
        if not lines:
            excluded.append({'slide':n,'reason':'empty-slide'});continue
        header=re.match(r'^(\d+)\s*[.\-–)]\s*(.+)$',lines[0])
        titled=n>=694 and 0<(slide['firstRunFontSize'] or 0)<=2000 and len(lines)>1
        if n in INFERRED:
            start(INFERRED[n],n,'inferred-first-line')
        elif header and n!=113:
            number=int(header[1]);title=header[2].strip()
            # Slide 5 contains two title text boxes; use the last explicit title, preserving both in source-slides.
            removed=[lines.pop(0)]
            while lines and re.match(r'^'+str(number)+r'\s*\.\s*',lines[0]):
                removed.append(lines.pop(0));title=re.sub(r'^\d+\s*\.\s*','',removed[-1]).strip()
            start(title,n,'numbered-title',number)
            current['source']['removedTitleLines']=removed
        elif n==113:
            start('Não vou ficar sozinho, agora sou feliz',n,'inferred-first-line',28)
            # Here “28.” precedes actual lyrics, rather than a separate title.
            lines[0]=re.sub(r'^28\s*\.\s*','',lines[0]);current['review']['issues'].append('Número 28 removido da primeira linha da letra; conjunto de cânticos separado por mudanças do texto.')
        elif titled:
            title=lines.pop(0);start(title,n,'small-font-title');current['source']['removedTitleLines']=[title]
        if current is None:raise ValueError(f'Slide {n} has no song boundary')
        current['source']['slides'].append(n)
        if lines:
            section_id=f'slide-{n}'
            current['sections'].append({'id':section_id,'label':f'Slide {n}','text':'\n'.join(lines)})
            current['sequence'].append(section_id)
    groups={}
    for song in songs:groups.setdefault(fold(song['title']),[]).append(song)
    for group in groups.values():
        if len(group)>1:
            for song in group:song['review']['issues'].append('Título repetido no catálogo; versões preservadas separadamente nos slides '+', '.join(str(s['source']['firstSlide']) for s in group)+'.')
    # These source ranges contain possible medleys/untitled changes. Do not invent corrections.
    for song in songs:
        if song['source']['firstSlide'] in (35,381,954):song['review']['issues'].append('Conferir possíveis mudanças de música ou sequência de cânticos nesta faixa de slides.')
        if re.fullmatch(r'\d+',song['title']):song['review']['issues'].append('Título numérico preservado literalmente; confirmar identificação.')
    return {'format':'zamar-song-library','schemaVersion':1,'name':'Letras Encontro',
      'source':{'filename':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'slideCount':len(slides)},
      'review':{'status':'pending','policy':'Texto do PowerPoint preservado; sem substituição por letras da internet. Autores não informados permanecem vazios.'},
      'songs':songs,'excludedSlides':excluded},slides

def main():
    parser=argparse.ArgumentParser();parser.add_argument('pptx',type=Path);parser.add_argument('--output',type=Path,default=Path('library/encontro'))
    args=parser.parse_args();catalog,slides=extract(args.pptx);args.output.mkdir(parents=True,exist_ok=True)
    for name,value in [('songs.json',catalog),('source-slides.json',{'source':catalog['source'],'slides':slides})]:
        (args.output/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    flagged=[s for s in catalog['songs'] if s['review']['issues']]
    report=['# Revisão da biblioteca Encontro','',f"Fonte: `{catalog['source']['filename']}`. SHA-256: `{catalog['source']['sha256']}`.",'',
      f"{len(slides)} slides; {len(catalog['songs'])} registros; {len(catalog['excludedSlides'])} slides vazios; {len(flagged)} registros com alertas específicos.",'',
      'Todos os registros aguardam revisão humana. Autores, integridade editorial e direitos de distribuição não foram inferidos. Nenhuma letra foi baixada da internet.', '',
      'Títulos repetidos e repetições de slides foram preservados. Cada seção corresponde ao texto de um slide. A numeração usa a ordem de apresentação do PPTX, não a ordem dos arquivos ZIP.', '',
      '| Início | Título | Conferência necessária |','| --- | --- | --- |']
    for song in flagged:report.append(f"| {song['source']['firstSlide']} | {song['title'].replace('|','/')} | {' '.join(song['review']['issues'])} |")
    (args.output/'REVISAO.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
    print(json.dumps({'slides':len(slides),'songs':len(catalog['songs']),'flagged':len(flagged),'empty':len(catalog['excludedSlides'])}))
if __name__=='__main__':main()
