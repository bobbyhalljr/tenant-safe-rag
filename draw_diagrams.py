from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import base64,json
p=Path('/home/cua/workspace/2026-10-08-tenant-safe-rag/images');p.mkdir(exist_ok=True)
normal='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(n,strong=False):return ImageFont.truetype(bold if strong else normal,n)
def canvas(title,subtitle):
 im=Image.new('RGB',(1500,750),'#100c24');d=ImageDraw.Draw(im)
 d.text((60,45),title,font=font(40,True),fill='#f1f3ff')
 d.text((60,104),subtitle,font=font(23),fill='#bcb1de')
 return im,d
im,d=canvas('Same scores. Different filter order.','Synthetic query: refund policy | trusted scope: acme / support | k = 2')
for x,title,lines,color in [
 (60,'Rank, then filter',['Global top two:','b1 / beta: 0.99','b2 / beta: 0.98','Neither is authorized.','Returned: 0 documents','Authorized recall: 0/2'],'#e5a0c2'),
 (780,'Filter, then rank',['Eligible: a1, a2, a3','a1 / acme: 0.91','a2 / acme: 0.89','a3 / acme: 0.80','Returned: a1, a2','Authorized recall: 2/2'],'#59e4f2')]:
 d.rounded_rectangle((x,175,x+660,625),radius=24,fill='#201936',outline=color,width=3)
 d.text((x+30,202),title,font=font(32,True),fill=color)
 for j,line in enumerate(lines):d.text((x+30,275+j*48),line,font=font(26),fill='#f1f3ff')
d.text((60,676),'Also excluded: a-hr (0.95), same tenant but HR-only. Scores are hand-set, not embeddings.',font=font(23),fill='#bcb1de')
im.save(p/'filter-order.png')
im,d=canvas('Authorization belongs before text leaves the store','A final-answer filter cannot retract text already sent to a reranker.')
cards=[
 ('1. Trusted scope',['Server-authenticated','Tenant + access groups','Missing auth: no results']),
 ('2. Eligible top-k',['Filter authorized docs','Then rank and take k','Never trust model scope']),
 ('3. Downstream',['Only eligible text','Reranker + model','Trace + cache + citations'])]
for i,(title,lines) in enumerate(cards):
 x=60+i*480
 d.rounded_rectangle((x,210,x+420,520),radius=24,fill='#201936',outline='#59e4f2',width=3)
 d.text((x+25,240),title,font=font(29,True),fill='#59e4f2')
 for j,line in enumerate(lines):d.text((x+25,310+j*53),line,font=font(23),fill='#f1f3ff')
 if i<2:d.text((x+438,348),'>',font=font(31,True),fill='#59e4f2')
d.text((60,583),'Fixture: late check sends 2 foreign texts; guarded path returns only a1 and a2.',font=font(26),fill='#f1f3ff')
d.text((60,676),'8 scenario checks passed | no vector index, live reranker, authentication service or model call',font=font(23),fill='#bcb1de')
im.save(p/'access-boundary.png')
