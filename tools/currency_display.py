"""Reference yen estimates. ECB 2026-10-09, 1 EUR = 177.34 JPY."""
import re, math
RATE=177.34
DATE='2026-10-09'
SOURCE='https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html'
NUMBER=r'\d[\d,]*(?:\.\d+)?'
PATTERN=re.compile(r'€\s*('+NUMBER+r')(?:\s*([〜～–-])\s*(?:€\s*)?('+NUMBER+r'))?|('+NUMBER+r')(?:\s*([〜～–-])\s*('+NUMBER+r'))?\s*(ユーロ|EUR|€)')
def yen(number):
 value=float(number.replace(',',''))*RATE;step=100 if value>=1000 else 10
 return f'{math.floor(value/step+0.5)*step:,}'
def convert(text):
 def replace(m):
  if re.match(r'\s*[（(]約[^）)]*円',text[m.end():]):return m.group(0)
  first=m[1] or m[4];second=m[3] or m[6]
  return m.group(0)+'（約'+yen(first)+('〜'+yen(second) if second else '')+'円）'
 return PATTERN.sub(replace,str(text))
