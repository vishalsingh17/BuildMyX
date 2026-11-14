"""Render the course's original diagrams; editorial tool, outside the core lab runtime."""
from pathlib import Path
import math
import os
os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).resolve().parents[3] / ".cache/genai-figures"))
os.environ.setdefault("XDG_CACHE_HOME", str(Path(__file__).resolve().parents[3] / ".cache"))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

OUT=Path(__file__).resolve().parents[2]/'content/generative-ai/assets';OUT.mkdir(parents=True,exist_ok=True)
plt.rcParams.update({'font.family':'DejaVu Sans','svg.hashsalt':'buildmyx-genai','font.size':10})
metadata={'Date':None,'Creator':'BuildMyX original teaching figures'}
fig,ax=plt.subplots(figsize=(9,4.8));fig.patch.set_facecolor('#faf8f3');ax.set_facecolor('#faf8f3');ax.set_xlim(0,1);ax.set_ylim(0,1);ax.axis('off')
items=[(.25,.82,'01 · Foundations','Chapters 1–4'),(.75,.82,'02 · Model mechanics','Chapters 5–10'),(.75,.51,'03 · Grounded applications','Chapters 11–18'),(.25,.51,'04 · Adaptation & agents','Chapters 19–23'),(.25,.20,'05 · Other modalities','Chapters 24–27'),(.75,.20,'06 · Advanced architectures','Chapters 28–31')]
for x,y,title,subtitle in items:
 ax.add_patch(FancyBboxPatch((x-.215,y-.10),.43,.20,boxstyle='round,pad=0.008,rounding_size=0.01',facecolor='#e6ebdf',edgecolor='#9ba991',linewidth=1))
 ax.text(x,y+.025,title,ha='center',va='center',color='#203f30',weight='bold',fontsize=10)
 ax.text(x,y-.035,subtitle,ha='center',va='center',color='#40503e',fontsize=9)
for start,end in [((.475,.82),(.525,.82)),((.75,.71),(.75,.62)),((.525,.51),(.475,.51)),((.25,.40),(.25,.31)),((.475,.20),(.525,.20))]:
 ax.annotate('',xy=end,xytext=start,arrowprops={'arrowstyle':'->','color':'#28553d','lw':1.5})
ax.text(.5,.025,'Finish with chapter 32: explain, test and improve your assistant',ha='center',color='#203f30',fontsize=10)
fig.savefig(OUT/'learning-route.svg',bbox_inches='tight',metadata=metadata);plt.close(fig)
queries=[[1.,0.],[0.,1.]];keys=[[1.,0.],[0.,1.],[2.,0.]];matrix=[]
for query in queries:
 scores=[sum(a*b for a,b in zip(query,key))/math.sqrt(2) for key in keys];weights=[math.exp(s-max(scores)) for s in scores];matrix.append([v/sum(weights) for v in weights])
fig,ax=plt.subplots(figsize=(7,2.8));fig.patch.set_facecolor('#faf8f3');ax.imshow(matrix,cmap='Greens',vmin=0,vmax=1,aspect='auto');ax.set_xticks(range(3),['Key 1','Key 2','Key 3']);ax.set_yticks(range(2),['Query [1, 0]','Query [0, 1]']);ax.set_title('Different queries produce different weighted mixtures',pad=15,color='#203f30')
for row in range(2):
 for col in range(3):ax.text(col,row,f'{matrix[row][col]:.3f}',ha='center',va='center',color='#18211c',fontsize=13,weight='bold')
fig.tight_layout();fig.savefig(OUT/'attention-weights.svg',bbox_inches='tight',metadata=metadata);plt.close(fig)
for name in ('learning-route.svg','attention-weights.svg'):
 path=OUT/name
 path.write_text('\n'.join(line.rstrip() for line in path.read_text().splitlines())+'\n')
print('Rendered two original Generative AI teaching figures.')
