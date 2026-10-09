#!/usr/bin/env python3
"""Original vector illustrations for the Germany visitor guide (no third-party photography)."""
from pathlib import Path
from html import escape
import json,math
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'germany/images/illustrations';OUT.mkdir(exist_ok=True)
N='#173b68';B='#cce1f1';G='#f5bd45';P='#f6e4ce'
def svg(name,body,w=460,h=280):
 title=escape(name)
 s=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{title}"><rect width="{w}" height="{h}" rx="18" fill="#edf4fb"/>'+body+'</svg>\n'
 (OUT/(name+'.svg')).write_text(s)
def person(x,y,color=N,scale=1):
 return f'<g transform="translate({x} {y}) scale({scale})"><circle cy="-22" r="21" fill="{P}"/><path d="M-23-25Q-22-57 12-44Q27-41 24-19L11-27Q-4-20-23-25" fill="{N}"/><path d="M-44 52V26Q-42 3 0 1Q42 3 44 26V52" fill="{color}"/></g>'
def stroke(path):return f'<path d="{path}" fill="none" stroke="{N}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
# Card: precise national outline plus a city/house and everyday life motifs.
countries=json.loads((ROOT/'germany/data/neighbor-countries.js').read_text().split('window.GERMANY_NEIGHBORS = ',1)[1].strip().rstrip(';'))
de=next(f for f in countries['features'] if f['properties']['name']=='Germany')['geometry']['coordinates'][0]
pts=' '.join(f'{70+(lon-5.8)*12:.1f},{227-(lat-47.1)*23:.1f}' for lon,lat in de)
body=f'<circle cx="342" cy="139" r="92" fill="{B}"/><polygon points="{pts}" fill="{G}" stroke="{N}" stroke-width="4"/><path d="M272 129L328 79L384 129V216H272Z" fill="white" stroke="{N}" stroke-width="5"/><rect x="317" y="160" width="27" height="56" fill="{B}"/><rect x="286" y="137" width="22" height="22" fill="{B}"/><rect x="351" y="137" width="22" height="22" fill="{B}"/><path d="M395 198v-57M395 167q-31-2-28-26q29 0 28 26M395 184q31 0 28-27q-29 0-28 27" stroke="{N}" stroke-width="4" fill="{G}"/>'
svg('basic-country',body)
# Card: application document, funds and a graduation cap, unmistakably scholarships.
body=f'<circle cx="145" cy="142" r="88" fill="{B}"/><rect x="90" y="50" width="148" height="190" rx="14" fill="white" stroke="{N}" stroke-width="5"/><path d="M116 90h92M116 118h61M116 146h75M116 173h44" stroke="{N}" stroke-width="7" stroke-linecap="round"/><circle cx="278" cy="183" r="57" fill="{G}" stroke="{N}" stroke-width="5"/><text x="278" y="203" text-anchor="middle" font-family="sans-serif" font-size="59" font-weight="bold" fill="{N}">€</text><path d="M276 80l58-30 58 30-58 29zM300 94v30q34 24 68 0V94" fill="{N}"/><path d="M392 80v53" stroke="{N}" stroke-width="5"/><circle cx="392" cy="137" r="6" fill="{G}"/>'
svg('basic-scholarship',body)
# Card: university building and open book.
body=f'<circle cx="230" cy="137" r="110" fill="{B}"/><path d="M88 104L230 39L372 104Z" fill="{G}" stroke="{N}" stroke-width="5"/><rect x="102" y="106" width="256" height="13" fill="{N}"/><path d="M119 119v90M173 119v90M287 119v90M341 119v90" stroke="{N}" stroke-width="18"/><rect x="96" y="213" width="268" height="15" rx="5" fill="{N}"/><circle cx="230" cy="83" r="15" fill="white" stroke="{N}" stroke-width="5"/><path d="M174 168q26-12 56 0q30-12 56 0v73q-28-12-56 0q-28-12-56 0Z" fill="white" stroke="{N}" stroke-width="4"/><path d="M230 168v73" stroke="{N}" stroke-width="4"/>'
svg('basic-university',body)
# Consultation: choose a person, choose channel/date, talk to the student.
body=f'<rect x="80" y="50" width="100" height="150" rx="12" fill="white" stroke="{N}" stroke-width="4"/>'+person(130,115,B,.65)+f'<path d="M98 174h63" stroke="{N}" stroke-width="5" stroke-linecap="round"/><rect x="208" y="35" width="154" height="211" rx="16" fill="white" stroke="{N}" stroke-width="5"/>'+person(285,130,N,.95)+f'<circle cx="349" cy="218" r="29" fill="{G}"/>'+stroke('M336 217l9 10 19-22')
svg('step-choose',body)
body=f'<rect x="64" y="54" width="205" height="146" rx="15" fill="white" stroke="{N}" stroke-width="5"/><rect x="85" y="74" width="163" height="104" rx="9" fill="{B}"/><rect x="112" y="104" width="71" height="44" rx="9" fill="{N}"/><path d="M183 117l26-14v47l-26-14Z" fill="{N}"/><path d="M49 210h235" stroke="{N}" stroke-width="11" stroke-linecap="round"/><rect x="306" y="59" width="87" height="170" rx="17" fill="white" stroke="{N}" stroke-width="5"/><path d="M323 94h55v60h-23l-15 13v-13h-17z" fill="{G}"/><path d="M335 112h30M335 128h20" stroke="{N}" stroke-width="4" stroke-linecap="round"/><circle cx="350" cy="203" r="6" fill="{N}"/>'
svg('step-method',body)
body=f'<rect x="59" y="49" width="342" height="177" rx="16" fill="white" stroke="{N}" stroke-width="5"/><rect x="76" y="66" width="146" height="142" rx="8" fill="{B}"/><rect x="239" y="66" width="145" height="142" rx="8" fill="#f9e7bd"/>'+person(149,143,N,1)+person(311,143,'#2d8957',1)+f'<path d="M125 242h210" stroke="{N}" stroke-width="12" stroke-linecap="round"/><path d="M126 24h76v45h-20l-15 12V69h-41Z" fill="{G}"/><path d="M141 40h45M141 52h31" stroke="{N}" stroke-width="4" stroke-linecap="round"/>'
svg('step-talk',body)
# Small, unbranded everyday shopping illustrations. The picture is not a specific product.
icons={
 'milk':f'<path d="M60 33h80l14 28v113H46V61Z" fill="white" stroke="{N}" stroke-width="5"/><path d="M60 33l-14 28h108l-14-28" fill="{B}"/><rect x="46" y="93" width="108" height="48" fill="{B}"/><path d="M72 52h54" stroke="{N}" stroke-width="4"/>',
 'bread':f'<path d="M45 96Q17 76 40 51Q62 29 88 48Q109 27 140 47Q175 67 150 95v70H45Z" fill="#e9b477" stroke="{N}" stroke-width="5"/><path d="M61 96Q40 75 62 60Q81 51 95 66Q111 48 137 64Q153 77 133 94v53H61Z" fill="#fff0d7"/>',
 'eggs':f'<path d="M22 105h156l-12 54H34Z" fill="{B}" stroke="{N}" stroke-width="5"/>'+''.join(f'<ellipse cx="{x}" cy="{y}" rx="20" ry="29" fill="{P}" stroke="{N}" stroke-width="4"/>' for x,y in [(51,80),(100,80),(148,80)])+f'<path d="M34 112h132" stroke="{N}" stroke-width="5"/>',
 'apple':f'<path d="M102 53Q74 30 44 58Q14 91 46 144Q63 171 98 155Q130 177 153 143Q184 91 156 60Q134 40 102 53" fill="#d96b50" stroke="{N}" stroke-width="5"/><path d="M102 57V29" stroke="{N}" stroke-width="7"/><path d="M104 38Q146 5 154 33Q137 49 104 38" fill="#87b597" stroke="{N}" stroke-width="4"/>',
 'pasta':f'<rect x="49" y="31" width="102" height="143" rx="9" fill="{G}" stroke="{N}" stroke-width="5"/><rect x="64" y="79" width="72" height="57" rx="9" fill="white"/>'+''.join(f'<path d="M{x} {y}l13-6 7 13-13 6z" fill="#e8bc69" stroke="{N}" stroke-width="2"/>' for x,y in [(77,95),(104,111),(75,120)])+f'<path d="M66 52h68" stroke="{N}" stroke-width="5"/>',
 'rice':f'<path d="M50 33h100l8 135H42Z" fill="white" stroke="{N}" stroke-width="5"/><path d="M46 96h108v51H46Z" fill="{B}"/>'+''.join(f'<ellipse cx="{x}" cy="{y}" rx="4" ry="9" transform="rotate({r} {x} {y})" fill="white" stroke="{N}" stroke-width="2"/>' for x,y,r in [(65,118,25),(86,116,-25),(113,113,40),(133,124,-20),(104,135,65)])+f'<path d="M64 58h72" stroke="{N}" stroke-width="5"/>',
 'water':f'<rect x="78" y="25" width="44" height="20" rx="4" fill="{N}"/><path d="M79 45v24Q58 76 58 97v63q0 16 17 16h50q17 0 17-16V97q0-21-21-28V45" fill="{B}" stroke="{N}" stroke-width="5"/><rect x="58" y="101" width="84" height="34" fill="white"/><path d="M71 86h57M71 152h57" stroke="{N}" stroke-width="4"/>',
 'chicken':f'<rect x="25" y="42" width="150" height="127" rx="20" fill="{B}" stroke="{N}" stroke-width="5"/><path d="M41 124q1-50 52-61q36-2 20 41q-3 33-54 36q-25 0-18-16M104 135q4-41 37-50q23 0 18 29q-2 32-37 36q-25 0-18-15" fill="#edbca8" stroke="{N}" stroke-width="4"/>',
 'toothpaste':f'<path d="M42 40h116l-14 115H57Z" fill="white" stroke="{N}" stroke-width="5"/><path d="M47 70h106l-5 38H52Z" fill="{B}"/><rect x="73" y="155" width="54" height="24" rx="3" fill="{N}"/><path d="M51 48h98" stroke="{N}" stroke-width="4"/>',
 'shower':f'<rect x="69" y="26" width="62" height="22" rx="5" fill="{N}"/><path d="M66 49q-11 9-11 22v85q0 17 17 17h56q17 0 17-17V71q0-13-11-22Z" fill="{G}" stroke="{N}" stroke-width="5"/><rect x="70" y="78" width="60" height="63" rx="12" fill="white"/><path d="M101 90q-23 26-13 37q13 12 24-1q7-10-11-36" fill="{B}" stroke="{N}" stroke-width="3"/>'
}
for name,body in icons.items():svg('price-'+name,body,200,200)
print('Built',len(icons)+6,'original SVG illustrations.')
